import { CHARACTERS } from '../data/characters.ts';
import type { AdvisorRecord, CharacterId, ForecastAudit, GameState } from './types';

/**
 * What each advisor's forecasts have actually been worth.
 *
 * The proposal corpus authors some forecasts to be wrong on purpose, and audits
 * them against what happened — that machinery already existed in
 * `consequenceLogic.ts`, which stamps a verdict on each audit once the outcome
 * is observable. What was missing was anyone keeping score.
 *
 * Without a running record the deliberate unreliability is just a trap: the
 * player is punished for trusting an advisor and given no way to learn which one
 * to distrust. With it, the finance minister's habit of describing the inflow
 * and omitting the exposure becomes something a player can notice by the
 * seventies and price in by the eighties. That is the same lesson the concept
 * cards teach about motivated reasoning, except the player works it out.
 *
 * Nothing here reveals a number before a decision: the record describes the
 * *advisor*, never the pending option.
 */

const EMPTY: AdvisorRecord = { judged: 0, right: 0, partial: 0, wrong: 0, bias: 0 };

/** Which way a forecast leaned, as a sign. */
const directionSign = (direction: ForecastAudit['predictedDirection']): number => {
    switch (direction) {
        case 'stronglyUp': return 2;
        case 'up': return 1;
        case 'mixed': return 0;
        case 'down': return -1;
        case 'stronglyDown': return -2;
    }
};

/**
 * Fold every newly-judged audit into the per-advisor record.
 *
 * Runs once per session, after consequences have been settled and verdicts
 * stamped. Audits already counted are skipped by comparing against the number
 * previously folded in, so a session that resolves nothing changes nothing.
 */
export function auditAdvisors(state: GameState): GameState {
    const audits = (state.forecastAudits ?? []).filter(audit => audit.verdict);
    if (audits.length === 0) return state;

    const fresh: Partial<Record<CharacterId, AdvisorRecord>> = {};

    for (const audit of audits) {
        const current = fresh[audit.advisorId] ?? { ...EMPTY };
        const predicted = directionSign(audit.predictedDirection);
        const observed = audit.observedDelta ?? 0;

        // Overpromising is predicting up and getting less than promised;
        // crying wolf is predicting disaster and getting away with it.
        let bias = 0;
        if (predicted > 0 && observed <= 0) bias = 1;
        else if (predicted < 0 && observed >= 0) bias = -1;

        fresh[audit.advisorId] = {
            judged: current.judged + 1,
            right: current.right + (audit.verdict === 'right' ? 1 : 0),
            partial: current.partial + (audit.verdict === 'partial' ? 1 : 0),
            wrong: current.wrong + (audit.verdict === 'wrong' ? 1 : 0),
            bias: current.bias + bias,
        };
    }

    return { ...state, advisorCalibration: fresh };
}

export const advisorRecord = (state: GameState, advisorId: CharacterId): AdvisorRecord =>
    state.advisorCalibration?.[advisorId] ?? EMPTY;

/** Share of judged forecasts that came good, counting partials as half. */
export const accuracyOf = (record: AdvisorRecord): number | null => {
    if (record.judged === 0) return null;
    return (record.right + record.partial * 0.5) / record.judged;
};

/**
 * The plain-language reading of an advisor's record.
 *
 * Deliberately coarse until there is enough evidence: claiming a minister is
 * unreliable on the strength of two forecasts would teach the player something
 * false about sample sizes while trying to teach them something true about
 * incentives.
 */
export function advisorReading(record: AdvisorRecord): string {
    if (record.judged < 3) return 'Not enough forecasts yet to judge.';

    const accuracy = accuracyOf(record) ?? 0;
    const lean = record.bias / record.judged;

    const reliability =
        accuracy >= 0.7 ? 'Usually right' :
        accuracy >= 0.45 ? 'Right about as often as not' :
        'Wrong more often than not';

    if (lean > 0.34) return `${reliability}, and consistently optimistic — outcomes come in below what is promised.`;
    if (lean < -0.34) return `${reliability}, and consistently alarmist — the disasters forecast tend not to arrive.`;
    return `${reliability}, with no systematic lean either way.`;
}

/** Every advisor's record, for the calibration panel. */
export const allAdvisorRecords = (
    state: GameState,
): Array<{ id: CharacterId; name: string; title: string; record: AdvisorRecord }> =>
    CHARACTERS.map(character => ({
        id: character.id,
        name: character.name,
        title: character.title,
        record: advisorRecord(state, character.id),
    }));
