import { chapterAt, isFinalChapter } from '../data/chapters.ts';
import { advanceYear, checkGameOver } from './gameLogic.ts';
import { driftFactions } from './factionLogic.ts';
import { applyProvincialPressure, provinceRevenue, tickProvinces } from './provinceLogic.ts';
import { resolveDueConsequences, resolveDuePromises } from './consequenceLogic.ts';
import { auditAdvisors } from './calibrationLogic.ts';
import { worldPressure } from './worldLogic.ts';
import type { DevelopmentProject, DiplomaticPartner, GameState } from './types';

/**
 * Running a cabinet session's worth of years.
 *
 * This is the single place the simulated year loop lives. Before sessions
 * covered multiple years the sequence was inline in `App.tsx`, which meant the
 * balance simulations were exercising a reimplementation of it rather than the
 * thing the game actually runs. Both now call this.
 *
 * Order within a year matters and is deliberate:
 *   1. the economy moves, under the decade's conditions,
 *   2. factions drift and the provinces develop or fester,
 *   3. the provinces press back on the centre,
 *   4. revenue is collected and next session's development budget set aside.
 *
 * Consequences and promises are settled once per *session*, after the years
 * have run, because they are scheduled in sessions rather than years.
 */

export interface ChapterResult {
    state: GameState;
    /** Years simulated, oldest first — the montage plays these in order. */
    years: number[];
    /** True if the run ended somewhere inside the span. */
    endedEarly: boolean;
}

export function runChapter(
    state: GameState,
    projects: DevelopmentProject[] = [],
    partners: DiplomaticPartner[] = [],
): ChapterResult {
    const chapter = chapterAt(state.turn);
    const years: number[] = [];
    let next = state;

    for (let step = 0; step < chapter.span; step += 1) {
        next = advanceYear(next, projects, partners);
        next = driftFactions(next);
        next = tickProvinces(next);
        next = applyProvincialPressure(next);

        // Extractive revenue tracks what the world is paying for ore this year,
        // which is how a commodity slump reaches the budget rather than just the
        // growth rate.
        const pressure = worldPressure(next);
        const collected = provinceRevenue(next.provinces ?? [], next.country) *
            pressure.commodityRevenueMultiplier;

        next = {
            ...next,
            treasury: next.treasury + collected,
            provinceBudget: Math.round(collected * 0.6) + 20,
        };

        years.push(next.year);

        // Collapse is checked every simulated year, not once per session. A
        // republic that falls apart in 1975 should not keep running to 1978
        // because the session had three years left in it.
        next = checkGameOver(next);
        if (next.gameOver) {
            return { state: next, years, endedEarly: true };
        }
    }

    // The session is over: advance the counter, then settle everything that was
    // scheduled against it.
    next = { ...next, turn: next.turn + 1, lastChapterYears: years };
    next = resolveDueConsequences(next);
    next = resolveDuePromises(next);
    next = auditAdvisors(next);

    next = checkGameOver(next);
    if (!next.gameOver && isFinalChapter(state.turn)) {
        // The last session has been played out; the campaign ends here even if
        // the final year's collapse tests all passed.
        next = {
            ...next,
            gameOver: true,
            gameOverReason: 'Term Limit Reached (2030). History will judge your legacy.',
        };
    }

    return { state: next, years, endedEarly: next.gameOver };
}
