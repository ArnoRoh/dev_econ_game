import type { AdvisorRecord, CharacterId, ConceptId, GameState } from './engine/types';
import { unlocksFor, nextUnlock } from './data/unlocks';
import type { UnlockId } from './data/unlocks';
import { FINAL_YEAR, FIRST_YEAR } from './data/chapters';

/**
 * What survives a run.
 *
 * Kept deliberately separate from `saveGame.ts`: that file owns the *active*
 * run and is cleared when a campaign ends, while this outlives every campaign
 * and must never be wiped by ordinary game-over handling. Two keys, two
 * versions, two migration paths — conflating them is how a player loses ten
 * runs of progress to a mid-game crash.
 */

const PROFILE_KEY = 'dev_econ_profile';

/** v1 is the first persisted profile; bump and migrate as the shape grows. */
const PROFILE_VERSION = 1;

export interface RunSummary {
    countryName: string;
    finalYear: number;
    score: number;
    endingId?: string;
    survived: boolean;
    at: number;
}

export interface MetaProfile {
    version: number;
    runs: number;
    completedRuns: number;
    bestScore: number;
    furthestYear: number;
    /** Cumulative, never spent — unlocks are thresholds, not purchases. */
    institutionalMemory: number;
    unlocked: UnlockId[];
    /** Advisor forecast records, pooled across every run. */
    advisorRecords: Partial<Record<CharacterId, AdvisorRecord>>;
    conceptsSeen: ConceptId[];
    endingsSeen: string[];
    crisesSeen: string[];
    history: RunSummary[];
}

export const emptyProfile = (): MetaProfile => ({
    version: PROFILE_VERSION,
    runs: 0,
    completedRuns: 0,
    bestScore: 0,
    furthestYear: FIRST_YEAR,
    institutionalMemory: 0,
    unlocked: [],
    advisorRecords: {},
    conceptsSeen: [],
    endingsSeen: [],
    crisesSeen: [],
    history: [],
});

export const loadProfile = (): MetaProfile => {
    try {
        const stored = localStorage.getItem(PROFILE_KEY);
        if (!stored) return emptyProfile();

        const parsed = JSON.parse(stored) as Partial<MetaProfile>;
        if (typeof parsed.version !== 'number' || parsed.version > PROFILE_VERSION) {
            // Written by a newer build. Leave it alone rather than overwrite it
            // with something older; the player may go back to that build.
            return emptyProfile();
        }

        return { ...emptyProfile(), ...parsed, version: PROFILE_VERSION };
    } catch {
        return emptyProfile();
    }
};

export const saveProfile = (profile: MetaProfile) => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...profile, version: PROFILE_VERSION }));
};

/**
 * Institutional memory earned by a finished run.
 *
 * Weighted toward *learning* rather than winning, which is the point of the
 * unlock curve. A run that collapses in 1978 having engaged with four concepts
 * and survived two crises teaches the civil service more than a cautious run
 * that reaches 2030 having done as little as possible.
 */
export function memoryFromRun(state: GameState, score: number): number {
    const yearsHeld = Math.max(0, state.year - FIRST_YEAR);
    const survival = state.year >= FINAL_YEAR ? 120 : 0;

    const conceptsEngaged = Object.keys(state.conceptProgress ?? {}).length;
    const crisesFaced = (state.resolvedCrisisIds ?? []).length;
    const achievements = (state.achievements ?? []).length;
    const decisions = (state.policyDecisions ?? []).filter(d => d.status === 'chosen').length;

    return Math.round(
        yearsHeld * 1.5 +
        survival +
        Math.max(0, score) * 0.05 +
        conceptsEngaged * 18 +
        crisesFaced * 30 +
        achievements * 12 +
        decisions * 2,
    );
}

/**
 * Pool two sets of advisor records.
 *
 * Used both to fold a finished run into the profile and, live, to show the
 * dossier this run's forecasts on top of every previous run's.
 */
export const mergeCalibration = (
    base: Partial<Record<CharacterId, AdvisorRecord>>,
    incoming: Partial<Record<CharacterId, AdvisorRecord>> = {},
): Partial<Record<CharacterId, AdvisorRecord>> => {
    const merged: Partial<Record<CharacterId, AdvisorRecord>> = { ...base };

    (Object.keys(incoming) as CharacterId[]).forEach(id => {
        const add = incoming[id];
        if (!add) return;
        const current = merged[id] ?? { judged: 0, right: 0, partial: 0, wrong: 0, bias: 0 };
        merged[id] = {
            judged: current.judged + add.judged,
            right: current.right + add.right,
            partial: current.partial + add.partial,
            wrong: current.wrong + add.wrong,
            bias: current.bias + add.bias,
        };
    });

    return merged;
};

const unique = <T,>(values: T[]): T[] => Array.from(new Set(values));

/** Fold a finished run into the profile and return it, along with what it unlocked. */
export function recordRun(
    profile: MetaProfile,
    state: GameState,
    score: number,
): { profile: MetaProfile; earned: number; newUnlocks: UnlockId[] } {
    const earned = memoryFromRun(state, score);
    const memory = profile.institutionalMemory + earned;
    const unlocked = unlocksFor(memory);
    const newUnlocks = unlocked.filter(id => !profile.unlocked.includes(id));

    const next: MetaProfile = {
        ...profile,
        version: PROFILE_VERSION,
        runs: profile.runs + 1,
        completedRuns: profile.completedRuns + (state.year >= FINAL_YEAR ? 1 : 0),
        bestScore: Math.max(profile.bestScore, score),
        furthestYear: Math.max(profile.furthestYear, state.year),
        institutionalMemory: memory,
        unlocked,
        advisorRecords: mergeCalibration(profile.advisorRecords, state.advisorCalibration ?? {}),
        conceptsSeen: unique([
            ...profile.conceptsSeen,
            ...(Object.keys(state.conceptProgress ?? {}) as ConceptId[]),
        ]),
        endingsSeen: unique([...profile.endingsSeen, ...(state.endingId ? [state.endingId] : [])]),
        crisesSeen: unique([...profile.crisesSeen, ...(state.resolvedCrisisIds ?? [])]),
        history: [
            {
                countryName: state.countryName,
                finalYear: state.year,
                score,
                endingId: state.endingId,
                survived: state.year >= FINAL_YEAR,
                at: Date.now(),
            },
            ...profile.history,
        ].slice(0, 20),
    };

    return { profile: next, earned, newUnlocks };
}

export const hasUnlock = (profile: MetaProfile, id: UnlockId): boolean =>
    profile.unlocked.includes(id);

/** Progress toward the next threshold, for the profile screen. */
export const unlockProgress = (profile: MetaProfile): { next: ReturnType<typeof nextUnlock>; ratio: number } => {
    const upcoming = nextUnlock(profile.institutionalMemory);
    if (!upcoming) return { next: null, ratio: 1 };

    return {
        next: upcoming,
        ratio: Math.min(1, profile.institutionalMemory / upcoming.threshold),
    };
};

export { unlocksFor, nextUnlock };
export type { UnlockId };
