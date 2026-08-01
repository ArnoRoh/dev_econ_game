import { KNOWLEDGE_CHECKS } from '../data/knowledgeChecks.ts';
import type { ConceptId, ConceptProgress, GameState, KnowledgeCheck } from './types';

/**
 * Learning progress is tracked, never enforced. A knowledge check can only ever
 * add something (an Advisor Insight token); it cannot cost stats or block a
 * turn, because a quiz that punishes you turns curiosity into anxiety.
 */

const EMPTY_PROGRESS: ConceptProgress = {
    exposures: 0,
    correctPredictions: 0,
    correctKnowledgeChecks: 0,
    lastSeenTurn: 0,
};

export const conceptProgressFor = (state: GameState, conceptId: ConceptId): ConceptProgress =>
    state.conceptProgress?.[conceptId] ?? EMPTY_PROGRESS;

/** Record that the player has just met these concepts in a live decision. */
export function recordConceptExposure(state: GameState, conceptIds: ConceptId[]): GameState {
    if (conceptIds.length === 0) return state;
    const progress = { ...(state.conceptProgress ?? {}) };

    for (const id of conceptIds) {
        const current = progress[id] ?? EMPTY_PROGRESS;
        progress[id] = {
            ...current,
            exposures: current.exposures + 1,
            lastSeenTurn: state.turn,
        };
    }

    return { ...state, conceptProgress: progress };
}

/**
 * Choose a check to offer, if any. The rule is "seen twice, not yet answered",
 * which reliably means the player has enough context to reason rather than
 * guess. At most one per turn.
 */
export function selectKnowledgeCheck(state: GameState): KnowledgeCheck | null {
    const answered = new Set(state.answeredChecks ?? []);

    const ready = KNOWLEDGE_CHECKS.filter(check => {
        if (answered.has(check.id)) return false;
        return conceptProgressFor(state, check.conceptId).exposures >= 2;
    });

    if (ready.length === 0) return null;

    // Prefer the concept met most recently, so the check lands while it is fresh.
    return ready.sort(
        (left, right) =>
            conceptProgressFor(state, right.conceptId).lastSeenTurn -
            conceptProgressFor(state, left.conceptId).lastSeenTurn,
    )[0];
}

export function answerKnowledgeCheck(
    state: GameState,
    check: KnowledgeCheck,
    answerId: string,
): { state: GameState; correct: boolean } {
    const correct = answerId === check.correctAnswerId;
    const progress = { ...(state.conceptProgress ?? {}) };
    const current = progress[check.conceptId] ?? EMPTY_PROGRESS;

    progress[check.conceptId] = {
        ...current,
        correctKnowledgeChecks: current.correctKnowledgeChecks + (correct ? 1 : 0),
    };

    return {
        correct,
        state: {
            ...state,
            conceptProgress: progress,
            answeredChecks: [...(state.answeredChecks ?? []), check.id],
            advisorInsight: (state.advisorInsight ?? 0) + (correct ? 1 : 0),
        },
    };
}

/** Spend a token to sharpen the forecasts on the proposal currently open. */
export function spendAdvisorInsight(state: GameState): GameState {
    if ((state.advisorInsight ?? 0) <= 0) return state;
    return { ...state, advisorInsight: (state.advisorInsight ?? 0) - 1 };
}

export interface LearningSummary {
    conceptsMet: number;
    conceptsTotal: number;
    checksCorrect: number;
    checksTaken: number;
    forecastsRight: number;
    forecastsJudged: number;
}

export function summariseLearning(state: GameState, conceptTotal: number): LearningSummary {
    const progress = state.conceptProgress ?? {};
    const entries = Object.values(progress) as ConceptProgress[];
    const audits = (state.forecastAudits ?? []).filter(audit => audit.verdict);

    return {
        conceptsMet: entries.filter(entry => entry.exposures > 0).length,
        conceptsTotal: conceptTotal,
        checksCorrect: entries.reduce((sum, entry) => sum + entry.correctKnowledgeChecks, 0),
        checksTaken: (state.answeredChecks ?? []).length,
        forecastsRight: audits.filter(audit => audit.verdict === 'right').length,
        forecastsJudged: audits.length,
    };
}
