import type {
    CountryStats,
    ForecastAudit,
    GameState,
    NewspaperItem,
    PolicyDecisionRecord,
    PromiseRecord,
    ScheduledConsequence,
} from './types';
import { applyFactionEffects } from './factionLogic.ts';
import { clampStats } from './gameLogic.ts';

/**
 * Delayed consequences are the spine of the design: a choice is interesting
 * only when its cost arrives after you have stopped thinking about it. Nothing
 * here is random — once a consequence is scheduled it is deterministic, so a
 * reloaded save produces the same history.
 */

const getScheduled = (state: GameState): ScheduledConsequence[] => state.scheduledConsequences ?? [];
const getDecisions = (state: GameState): PolicyDecisionRecord[] => state.policyDecisions ?? [];

/** Stats where a rise is bad news for the country. */
const INVERTED_STATS = new Set<keyof CountryStats>(['famineRisk', 'externalDebt']);

/** Judge a consequence good, bad or mixed so the newspaper can colour it. */
export function toneOf(effects: Partial<CountryStats>, treasuryEffect = 0): NewspaperItem['tone'] {
    let score = 0;
    (Object.entries(effects) as [keyof CountryStats, number][]).forEach(([key, value]) => {
        if (typeof value !== 'number' || value === 0) return;
        score += INVERTED_STATS.has(key) ? -Math.sign(value) : Math.sign(value);
    });
    if (treasuryEffect) score += Math.sign(treasuryEffect);
    if (score > 0) return 'good';
    if (score < 0) return 'bad';
    return 'mixed';
}

const applyStatEffects = (stats: CountryStats, effects: Partial<CountryStats>): CountryStats => {
    const next = { ...stats };
    (Object.entries(effects) as [keyof CountryStats, number][]).forEach(([key, value]) => {
        if (typeof value === 'number' && typeof next[key] === 'number') {
            (next[key] as number) = (next[key] as number) + value;
        }
    });
    return clampStats(next);
};

/**
 * Score an authored forecast against what actually happened, so the debrief can
 * tell the player which advisor was worth listening to.
 */
function auditDirection(
    direction: ForecastAudit['predictedDirection'],
    delta: number,
): ForecastAudit['verdict'] {
    const rising = delta > 0.001;
    const falling = delta < -0.001;

    switch (direction) {
        case 'stronglyUp':
            return rising ? 'right' : falling ? 'wrong' : 'partial';
        case 'up':
            return rising ? 'right' : falling ? 'wrong' : 'partial';
        case 'down':
            return falling ? 'right' : rising ? 'wrong' : 'partial';
        case 'stronglyDown':
            return falling ? 'right' : rising ? 'wrong' : 'partial';
        case 'mixed':
            return 'partial';
        default:
            return 'partial';
    }
}

/**
 * Resolve every consequence due this turn.
 *
 * Flag gates are checked at resolution rather than scheduling time, so a
 * consequence authored to depend on later policy ("if credit reached
 * smallholders") correctly reflects what the player did in the intervening
 * years. A blocked consequence is dropped, not deferred.
 */
export function resolveDueConsequences(state: GameState): GameState {
    const due = getScheduled(state).filter(consequence => consequence.dueTurn <= state.turn);
    if (due.length === 0) return state;

    let next: GameState = state;
    const published: NewspaperItem[] = [];
    const resolvedIds = new Set<string>();
    const decisionsTouched = new Map<string, string[]>();

    for (const consequence of due) {
        const { spec } = consequence;
        resolvedIds.add(consequence.id);

        const blocked =
            spec.requiredFlags?.some(flag => !next.flags[flag]) ||
            spec.blockedByFlags?.some(flag => next.flags[flag]);
        if (blocked) continue;

        const flags = { ...next.flags };
        spec.setsFlags?.forEach(flag => {
            flags[flag] = true;
        });

        const sourceDecision = getDecisions(next).find(
            decision => decision.id === consequence.sourceDecisionId,
        );

        next = {
            ...next,
            country: applyStatEffects(next.country, spec.effects),
            treasury: Math.max(0, next.treasury + (spec.treasuryEffect ?? 0)),
            flags,
        };

        if (spec.factionEffects?.length) {
            next = applyFactionEffects(next, spec.factionEffects);
        }

        published.push({
            id: consequence.id,
            turn: next.turn,
            year: next.year,
            headline: spec.headline,
            narrative: spec.narrative,
            effects: spec.effects,
            treasuryEffect: spec.treasuryEffect,
            conceptIds: spec.conceptIds,
            sourceDecisionId: consequence.sourceDecisionId,
            sourceTitle: sourceDecision?.proposalTitle,
            origin: sourceDecision?.status === 'ignored' ? 'ignored' : 'chosen',
            tone: toneOf(spec.effects, spec.treasuryEffect),
        });

        const existing = decisionsTouched.get(consequence.sourceDecisionId) ?? [];
        decisionsTouched.set(consequence.sourceDecisionId, [...existing, consequence.id]);
    }

    // Close out any forecasts whose metric just moved.
    const audits = (next.forecastAudits ?? []).map(audit => {
        if (audit.verdict) return audit;
        const touched = published.find(item => item.sourceDecisionId === audit.decisionId);
        if (!touched || !audit.affectedMetric) return audit;

        const delta =
            audit.affectedMetric === 'treasury'
                ? touched.treasuryEffect ?? 0
                : (touched.effects[audit.affectedMetric as keyof CountryStats] as number | undefined) ?? 0;
        if (delta === 0) return audit;

        return { ...audit, observedDelta: delta, verdict: auditDirection(audit.predictedDirection, delta) };
    });

    return {
        ...next,
        scheduledConsequences: getScheduled(next).filter(consequence => !resolvedIds.has(consequence.id)),
        policyDecisions: getDecisions(next).map(decision => {
            const resolved = decisionsTouched.get(decision.id);
            return resolved
                ? { ...decision, resolvedConsequenceIds: [...decision.resolvedConsequenceIds, ...resolved] }
                : decision;
        }),
        newspaper: [...published, ...(next.newspaper ?? [])].slice(0, 60),
        forecastAudits: audits,
    };
}

// ---------------------------------------------------------------------------
// Promises
// ---------------------------------------------------------------------------

/**
 * Record a commitment to a faction. Promises are what make characters feel like
 * people rather than meters: they are remembered, they come due, and breaking
 * one costs far more than never having made it.
 */
export function makePromise(
    state: GameState,
    promise: Omit<PromiseRecord, 'status'>,
): GameState {
    const promises = state.promises ?? [];
    if (promises.some(existing => existing.id === promise.id)) return state;

    const factions = state.factions;
    const nextFactions = factions
        ? {
              ...factions,
              [promise.factionId]: {
                  ...factions[promise.factionId],
                  promisesOwed: [...factions[promise.factionId].promisesOwed, promise.description],
              },
          }
        : factions;

    return {
        ...state,
        promises: [...promises, { ...promise, status: 'active' }],
        factions: nextFactions,
    };
}

/**
 * Settle promises that have come due. A promise is kept if its completion flag
 * is set by the deadline; otherwise the faction that was promised reacts, and
 * the betrayal is published so the player sees the connection.
 */
export function resolveDuePromises(state: GameState): GameState {
    const promises = state.promises ?? [];
    const due = promises.filter(
        promise => promise.status === 'active' && promise.deadlineTurn <= state.turn,
    );
    if (due.length === 0) return state;

    let next = state;
    const published: NewspaperItem[] = [];

    for (const promise of due) {
        const kept = Boolean(next.flags[promise.completionFlag]);

        next = applyFactionEffects(next, [
            {
                factionId: promise.factionId,
                support: kept ? 8 : -16,
                radicalization: kept ? -5 : 12,
                ...(kept ? {} : { grievance: `Unkept promise: ${promise.description}` }),
            },
        ]);

        published.push({
            id: `promise-${promise.id}`,
            turn: next.turn,
            year: next.year,
            headline: kept ? 'A Promise Kept' : 'A Promise Broken',
            narrative: kept
                ? `The government delivered on its commitment: ${promise.description}`
                : `The commitment made in earlier years has lapsed: ${promise.description}. Those who were promised have noticed.`,
            effects: {},
            conceptIds: [],
            sourceDecisionId: promise.id,
            origin: 'promise',
            tone: kept ? 'good' : 'bad',
        });
    }

    const settled = new Map(due.map(promise => [promise.id, Boolean(next.flags[promise.completionFlag])]));

    return {
        ...next,
        promises: promises.map(promise =>
            settled.has(promise.id)
                ? { ...promise, status: settled.get(promise.id) ? ('kept' as const) : ('broken' as const) }
                : promise,
        ),
        newspaper: [...published, ...(next.newspaper ?? [])].slice(0, 60),
    };
}

/** Everything the newspaper should show for the turn just begun. */
export const newspaperForTurn = (state: GameState, turn: number): NewspaperItem[] =>
    (state.newspaper ?? []).filter(item => item.turn === turn);
