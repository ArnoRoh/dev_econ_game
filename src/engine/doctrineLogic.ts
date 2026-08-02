import { ECONOMIC_CONCEPTS } from '../data/concepts.ts';
import type { ConceptId, EconomicConcept, GameState } from './types';

/**
 * What each theory was worth in *this* republic.
 *
 * The concept cards teach mechanisms and state honestly that several of them
 * are disputed. That is a claim about the literature. This is the other half:
 * a record of what happened when the player actually governed by them here,
 * under this country's institutions, in these decades.
 *
 * The point is not to score the player. It is that a well-supported mechanism
 * can fail in a state that cannot administer it, and a disputed one can work
 * anyway — which is the argument the development literature has been having
 * since 1950, and the reason `contestation` exists as a field at all. A player
 * who finishes a run having watched export orientation deliver in one campaign
 * and fail in the next has learned something no concept card can tell them.
 *
 * Everything here is derived from records the run already kept: decisions carry
 * `conceptIds`, and forecast audits carry verdicts stamped by
 * `consequenceLogic` once an outcome became observable.
 */

export interface DoctrineRecord {
    conceptId: ConceptId;
    title: string;
    contestation: EconomicConcept['contestation'];
    /** Decisions taken that invoked this concept. */
    invoked: number;
    /** Forecasts attached to those decisions that have been judged. */
    judged: number;
    right: number;
    wrong: number;
    /** Net direction of the immediate effects, as a crude "did it help here". */
    netStability: number;
    netGrowth: number;
    /** Plain-language verdict for this run. */
    verdict: string;
}

const CONCEPTS_BY_ID = new Map<string, EconomicConcept>(
    (ECONOMIC_CONCEPTS as readonly EconomicConcept[]).map(concept => [concept.id, concept]),
);

/**
 * Build the per-theory record for a finished run.
 *
 * Only concepts the player actually invoked appear. A report listing every
 * concept in the corpus would bury the handful that this particular government
 * governed by, which are the only ones the player has evidence about.
 */
export function doctrineReport(state: GameState): DoctrineRecord[] {
    const decisions = (state.policyDecisions ?? []).filter(decision => decision.status === 'chosen');
    if (decisions.length === 0) return [];

    const audits = state.forecastAudits ?? [];
    const auditsByDecision = new Map<string, typeof audits>();
    for (const audit of audits) {
        if (!audit.verdict) continue;
        const list = auditsByDecision.get(audit.decisionId) ?? [];
        list.push(audit);
        auditsByDecision.set(audit.decisionId, list);
    }

    const records = new Map<ConceptId, DoctrineRecord>();

    for (const decision of decisions) {
        for (const conceptId of decision.conceptIds) {
            const concept = CONCEPTS_BY_ID.get(conceptId);
            if (!concept) continue;

            const current = records.get(conceptId) ?? {
                conceptId,
                title: concept.title,
                contestation: concept.contestation,
                invoked: 0,
                judged: 0,
                right: 0,
                wrong: 0,
                netStability: 0,
                netGrowth: 0,
                verdict: '',
            };

            current.invoked += 1;
            current.netStability += decision.immediateEffects.stability ?? 0;
            current.netGrowth += decision.immediateEffects.gdpGrowthRate ?? 0;

            for (const audit of auditsByDecision.get(decision.id) ?? []) {
                current.judged += 1;
                if (audit.verdict === 'right') current.right += 1;
                if (audit.verdict === 'wrong') current.wrong += 1;
            }

            records.set(conceptId, current);
        }
    }

    for (const record of records.values()) {
        record.verdict = verdictFor(record);
    }

    return [...records.values()].sort((left, right) => right.invoked - left.invoked);
}

/**
 * The one-line reading.
 *
 * Deliberately refuses to convert a handful of decisions into a confident
 * judgement — the sample really is tiny, and teaching a player to draw strong
 * conclusions from four observations would undo the point of the contestation
 * fields.
 */
function verdictFor(record: DoctrineRecord): string {
    if (record.invoked < 2) {
        return 'Invoked once. One decision is an anecdote, not evidence about a mechanism.';
    }

    const helped = record.netStability > 0 || record.netGrowth > 0;
    const forecastNote =
        record.judged === 0
            ? 'Nothing attached to it has come due yet.'
            : record.right > record.wrong
                ? `Forecasts made under it held up ${record.right} time${record.right === 1 ? '' : 's'} against ${record.wrong} that did not.`
                : record.wrong > record.right
                    ? `Forecasts made under it failed ${record.wrong} time${record.wrong === 1 ? '' : 's'} against ${record.right} that held.`
                    : 'Forecasts made under it were right about as often as they were wrong.';

    const outcomeNote = helped
        ? 'On the immediate numbers it went the way the theory said it would here.'
        : 'On the immediate numbers it did not go the way the theory said it would here.';

    const caution =
        record.contestation === 'actively-disputed'
            ? ' This is a disputed claim, so one republic settles nothing.'
            : record.contestation === 'contested'
                ? ' The literature is divided on this, and a single run is not a tiebreak.'
                : '';

    return `${outcomeNote} ${forecastNote}${caution}`;
}

/** Concepts the player met but never governed by — the roads not taken. */
export function untestedConcepts(state: GameState): EconomicConcept[] {
    const invoked = new Set(
        (state.policyDecisions ?? [])
            .filter(decision => decision.status === 'chosen')
            .flatMap(decision => decision.conceptIds),
    );
    const seen = Object.keys(state.conceptProgress ?? {}) as ConceptId[];

    return seen
        .filter(id => !invoked.has(id))
        .map(id => CONCEPTS_BY_ID.get(id))
        .filter((concept): concept is EconomicConcept => Boolean(concept));
}
