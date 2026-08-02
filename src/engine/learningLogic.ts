import { KNOWLEDGE_CHECKS } from '../data/knowledgeChecks.ts';
import type { CharacterId, ConceptId, ConceptProgress, CountryStats, ForecastAudit, GameState, KnowledgeCheck, QualitativeForecast } from './types';

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

/**
 * How often an advisor's authored forecasts have actually come true.
 *
 * This is the mechanic that turns advisors into characters rather than tooltips:
 * over a campaign the player learns whose confidence is worth anything, which is
 * a transferable habit as much as a game skill.
 */
export function advisorRecord(
    audits: ForecastAudit[],
    advisorId: CharacterId,
): { right: number; judged: number } {
    const judged = audits.filter(audit => audit.advisorId === advisorId && audit.verdict);
    return {
        right: judged.filter(audit => audit.verdict === 'right').length,
        judged: judged.length,
    };
}

const OPTIMISTIC: ReadonlySet<QualitativeForecast['predictedDirection']> = new Set(['up', 'stronglyUp']);
const PESSIMISTIC: ReadonlySet<QualitativeForecast['predictedDirection']> = new Set(['down', 'stronglyDown']);

/** How an advisor's calls have actually turned out, across a whole run. */
export interface AdvisorCalibration {
    right: number;
    partial: number;
    wrong: number;
    judged: number;
    /** Share of judged calls that were right, 0-1. `null` below `MIN_CALLS_FOR_VERDICT`. */
    hitRate: number | null;
    /**
     * Positive when they overpromise, negative when they cry wolf, 0 when their
     * misses go both ways. Measured in share of judged calls, -1 to 1.
     */
    bias: number;
    /** Hit rate on the calls they staked high confidence on. `null` if too few. */
    confidentHitRate: number | null;
    /** Hit rate on their low- and medium-confidence calls. `null` if too few. */
    hedgedHitRate: number | null;
    /** Metrics this advisor has been judged on, worst first. */
    weakestMetrics: { metric: string; right: number; judged: number }[];
}

/**
 * Below this, a record is noise and the UI should say so rather than print a
 * percentage that will swing twenty points on the next call.
 */
export const MIN_CALLS_FOR_VERDICT = 4;

const rate = (right: number, judged: number): number | null =>
    judged >= MIN_CALLS_FOR_VERDICT ? right / judged : null;

/**
 * The aggregate behind `advisorRecord`.
 *
 * A single wrong forecast tells the player nothing — advisors are authored to be
 * wrong sometimes, and any one call can miss honestly. What is worth learning is
 * the pattern: that this minister's optimism is systematic, or that their
 * high-confidence calls are no better than their hedged ones. The second is the
 * sharper lesson, because an advisor who is only as accurate when certain as when
 * unsure is not giving the player information at all, however authoritative they
 * sound. Surfacing that is the point of the whole audit mechanic.
 */
export function advisorCalibration(
    audits: ForecastAudit[],
    advisorId: CharacterId,
): AdvisorCalibration {
    const judged = audits.filter(audit => audit.advisorId === advisorId && audit.verdict);

    const right = judged.filter(audit => audit.verdict === 'right').length;
    const partial = judged.filter(audit => audit.verdict === 'partial').length;
    const wrong = judged.filter(audit => audit.verdict === 'wrong').length;

    // Bias is measured only on misses. A correct optimistic call is not optimism,
    // it is being right, and counting it would make an accurate advisor look
    // biased purely for working on things that tend to improve.
    const missed = judged.filter(audit => audit.verdict === 'wrong');
    const overPromised = missed.filter(audit => OPTIMISTIC.has(audit.predictedDirection)).length;
    const criedWolf = missed.filter(audit => PESSIMISTIC.has(audit.predictedDirection)).length;

    const confident = judged.filter(audit => audit.confidence === 'high');
    const hedged = judged.filter(audit => audit.confidence !== 'high');

    const byMetric = new Map<string, { right: number; judged: number }>();
    for (const audit of judged) {
        const metric = audit.affectedMetric ?? 'unstated';
        const entry = byMetric.get(metric) ?? { right: 0, judged: 0 };
        entry.judged += 1;
        if (audit.verdict === 'right') entry.right += 1;
        byMetric.set(metric, entry);
    }

    return {
        right,
        partial,
        wrong,
        judged: judged.length,
        hitRate: rate(right, judged.length),
        bias: judged.length === 0 ? 0 : (overPromised - criedWolf) / judged.length,
        confidentHitRate: rate(
            confident.filter(audit => audit.verdict === 'right').length,
            confident.length,
        ),
        hedgedHitRate: rate(
            hedged.filter(audit => audit.verdict === 'right').length,
            hedged.length,
        ),
        weakestMetrics: [...byMetric.entries()]
            .map(([metric, tally]) => ({ metric, ...tally }))
            .sort((a, b) => a.right / a.judged - b.right / b.judged)
            .slice(0, 3),
    };
}

/**
 * The stat an option is most likely to be judged on. Used to ask the player for
 * a prediction before they commit, and to score it afterwards. Returns the key
 * only — never the magnitude, which the player must not see before deciding.
 */
export function headlineMetric(effects: Partial<CountryStats>): keyof CountryStats | null {
    // Growth and stability read as the headline even at small magnitudes, so
    // they are weighted rather than compared raw against, say, a GDP delta.
    const weight: Partial<Record<keyof CountryStats, number>> = {
        gdpGrowthRate: 20,
        stability: 2,
        eliteSatisfaction: 2,
        educationLevel: 2,
        famineRisk: 2,
        genderEquality: 2,
        militaryPower: 2,
        internationalRelations: 1.5,
        externalDebt: 0.2,
        gdp: 0.05,
        population: 4,
    };

    let best: keyof CountryStats | null = null;
    let bestScore = 0;

    for (const [key, value] of Object.entries(effects) as [keyof CountryStats, number][]) {
        if (typeof value !== 'number' || value === 0) continue;
        const score = Math.abs(value) * (weight[key] ?? 1);
        if (score > bestScore) {
            bestScore = score;
            best = key;
        }
    }

    return best;
}

/** Was the player's up/down/mixed call borne out by the actual delta? */
export function scorePrediction(
    predicted: 'up' | 'down' | 'mixed',
    delta: number,
    lowerIsBetter: boolean,
): boolean {
    // Judge in the direction the country cares about, not the raw sign.
    const effective = lowerIsBetter ? -delta : delta;
    if (predicted === 'up') return effective > 0;
    if (predicted === 'down') return effective < 0;
    return Math.abs(effective) < 0.5;
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
