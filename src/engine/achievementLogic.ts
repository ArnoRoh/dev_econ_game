import type { GameState } from './types';
import type { AchievementDef } from '../data/achievements';
import { ACHIEVEMENTS } from '../data/achievements';

/**
 * Returns the achievements newly earned this evaluation, and the updated state.
 * Idempotent: evaluating twice in a row yields no new achievements the second time.
 */
export function checkAchievements(state: GameState): {
    state: GameState;
    earned: AchievementDef[];
} {
    const previouslyEarned = new Set(state.achievements ?? []);
    const newEarned: AchievementDef[] = [];
    const allEarned: string[] = [...previouslyEarned];

    for (const achievement of ACHIEVEMENTS) {
        if (!previouslyEarned.has(achievement.id) && achievement.earned(state)) {
            newEarned.push(achievement);
            allEarned.push(achievement.id);
        }
    }

    if (newEarned.length === 0) {
        // Nothing new; return the same state reference to allow caller to skip re-render
        return { state, earned: [] };
    }

    // Return updated state with new achievements appended immutably
    const updatedState: GameState = {
        ...state,
        achievements: allEarned,
    };

    return { state: updatedState, earned: newEarned };
}

/**
 * All achievements with their earned status, for a gallery view.
 */
export function achievementProgress(state: GameState): Array<{ def: AchievementDef; earned: boolean }> {
    const earnedIds = new Set(state.achievements ?? []);
    return ACHIEVEMENTS.map(def => ({
        def,
        earned: earnedIds.has(def.id),
    }));
}
