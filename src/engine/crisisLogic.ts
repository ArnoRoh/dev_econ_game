import { crisisForChapter, crisisById } from '../data/crises.ts';
import type { CrisisSeverity, WorldCrisis } from '../data/crises.ts';
import { yearsToChapters } from '../data/chapters.ts';
import { applyCharacterMemory, applyFactionEffects } from './factionLogic.ts';
import { applyOption } from './gameLogic.ts';
import { makePromise } from './consequenceLogic.ts';
import type {
    CountryStats,
    EducationalPolicyOption,
    GameState,
    PolicyDecisionRecord,
    ScheduledConsequence,
} from './types';

/**
 * Resolving a world crisis.
 *
 * Structurally this mirrors `confirmProposal` in `agendaLogic.ts` — a crisis
 * option is an `EducationalPolicyOption` and produces the same decision record,
 * chronicle entry and scheduled consequences, so the archive, the debrief and
 * the ending logic all read it without special cases.
 *
 * The one difference is severity. A crisis option is authored at its baseline
 * weight and then scaled by how exposed this particular republic turned out to
 * be, so the same decision is a bad quarter for one run and a catastrophe for
 * another. Scaling is applied only in the harmful direction: a worse crisis
 * makes every answer cost more, it does not make an answer more rewarding.
 */

/** Stats where a rise is the bad outcome. */
const HARM_IS_POSITIVE: ReadonlySet<keyof CountryStats> = new Set(['externalDebt', 'famineRisk']);

/**
 * Scale an option's effects by crisis severity, in the harmful direction only.
 *
 * Amplifying the upside would make a severe crisis a better thing to be in than
 * a contained one whenever the player picked the option with a positive line on
 * it, which inverts the whole point of exposure.
 */
export const scaleForSeverity = (
    effects: Partial<CountryStats>,
    multiplier: number,
): Partial<CountryStats> => {
    if (multiplier === 1) return effects;

    const scaled: Partial<CountryStats> = {};
    (Object.keys(effects) as Array<keyof CountryStats>).forEach(key => {
        const value = effects[key];
        if (typeof value !== 'number') return;
        const harmful = HARM_IS_POSITIVE.has(key) ? value > 0 : value < 0;
        scaled[key] = harmful ? value * multiplier : value;
    });
    return scaled;
};

/** The crisis demanding this session, or null if the world is quiet. */
export function activeCrisis(state: GameState): WorldCrisis | null {
    const crisis = crisisForChapter(state.turn);
    if (!crisis) return null;
    if ((state.resolvedCrisisIds ?? []).includes(crisis.id)) return null;
    return crisis;
}

export const severityOf = (crisis: WorldCrisis, state: GameState): CrisisSeverity =>
    crisis.severity(state);

/**
 * Apply a chosen crisis response.
 *
 * Consumes the whole session: a crisis suspends the agenda rather than competing
 * with it, so there are no actions left afterwards and no proposals to ignore.
 */
export function resolveCrisis(
    state: GameState,
    crisis: WorldCrisis,
    optionOrId: EducationalPolicyOption | string,
): GameState {
    if ((state.resolvedCrisisIds ?? []).includes(crisis.id)) return state;

    const option = typeof optionOrId === 'string'
        ? crisis.options.find(candidate => candidate.id === optionOrId)
        : optionOrId;
    if (!option || !crisis.options.some(candidate => candidate.id === option.id)) return state;

    const severity = severityOf(crisis, state);
    const effects = scaleForSeverity(option.effects, severity.multiplier);
    // A treasury cost is a harm; a treasury inflow is the authored upside.
    const treasuryEffect = (option.treasuryEffect ?? 0) < 0
        ? (option.treasuryEffect ?? 0) * severity.multiplier
        : (option.treasuryEffect ?? 0);

    const decisionId = `${state.turn}-${crisis.id}-${option.id}`;
    const sponsorId = option.forecasts[0]?.advisorId ?? 'finance_minister';

    const scheduled: ScheduledConsequence[] = option.delayedConsequences.map(spec => ({
        id: `${decisionId}-${spec.id}`,
        sourceDecisionId: decisionId,
        dueTurn: state.turn + yearsToChapters(spec.delayTurns),
        spec: {
            ...spec,
            // A consequence of a severe crisis lands with the same weight the
            // crisis did, so the fuse from 1973 keeps burning at its own heat.
            effects: scaleForSeverity(spec.effects, severity.multiplier),
        },
    }));

    let next = applyOption(state, { text: option.text, effects, setFlags: option.setFlags });
    next = applyFactionEffects(next, option.factionEffects);
    next = applyCharacterMemory(next, sponsorId, `${crisis.year}: ${option.text}`);
    next = {
        ...next,
        treasury: Math.max(0, next.treasury + treasuryEffect),
        actionsRemaining: 0,
        agendaProposalIds: [],
        activeCrisisId: null,
        resolvedCrisisIds: [...(state.resolvedCrisisIds ?? []), crisis.id],
    };

    if (option.createsPromise) {
        const promise = option.createsPromise;
        next = makePromise(next, {
            id: `${decisionId}-${promise.id}`,
            madeTurn: state.turn,
            factionId: promise.factionId,
            description: promise.description,
            deadlineTurn: state.turn + yearsToChapters(promise.deadlineTurns),
            completionFlag: promise.completionFlag,
        });
    }

    const record: PolicyDecisionRecord = {
        id: decisionId,
        turn: state.turn,
        year: state.year,
        proposalId: crisis.id,
        proposalTitle: crisis.title,
        sponsorId,
        status: 'chosen',
        optionId: option.id,
        optionText: option.text,
        immediateEffects: effects,
        treasuryEffect,
        factionEffects: option.factionEffects,
        conceptIds: option.conceptIds,
        sourceIds: option.sourceIds,
        scheduledConsequenceIds: scheduled.map(consequence => consequence.id),
        resolvedConsequenceIds: [],
    };

    return {
        ...next,
        policyDecisions: [...(next.policyDecisions ?? []), record],
        scheduledConsequences: [...(next.scheduledConsequences ?? []), ...scheduled],
        forecastAudits: [
            ...(next.forecastAudits ?? []),
            ...option.forecasts.map(forecast => ({
                decisionId,
                advisorId: forecast.advisorId,
                summary: forecast.summary,
                predictedDirection: forecast.predictedDirection,
                confidence: forecast.confidence,
                affectedMetric: forecast.affectedMetric,
            })),
        ],
        chronicle: [
            ...next.chronicle,
            {
                id: decisionId,
                year: state.year,
                category: 'policy' as const,
                title: `${crisis.title} (${severity.level})`,
                decision: option.text,
                effects,
            },
        ],
    };
}

/** The world acts anyway when a crisis is somehow left unanswered. */
export function abandonCrisis(state: GameState, crisis: WorldCrisis): GameState {
    if ((state.resolvedCrisisIds ?? []).includes(crisis.id)) return state;

    const severity = severityOf(crisis, state);
    const spec = crisis.ignoreOutcome;
    const decisionId = `${state.turn}-${crisis.id}-unanswered`;

    return {
        ...state,
        activeCrisisId: null,
        actionsRemaining: 0,
        resolvedCrisisIds: [...(state.resolvedCrisisIds ?? []), crisis.id],
        scheduledConsequences: [
            ...(state.scheduledConsequences ?? []),
            {
                id: `${decisionId}-${spec.id}`,
                sourceDecisionId: decisionId,
                dueTurn: state.turn + yearsToChapters(spec.delayTurns),
                spec: { ...spec, effects: scaleForSeverity(spec.effects, severity.multiplier) },
            },
        ],
    };
}

export { crisisById };
