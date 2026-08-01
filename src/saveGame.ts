import type { DecisionOutcome, GameEvent, GameState, TurnPhase } from './engine/types';
import { createProvinces } from './data/provinces';

const ACTIVE_RUN_KEY = 'dev_econ_active_run';
/**
 * v5 adds the territorial layer and achievements.
 * v4 added the cabinet turn phase; v3 and earlier have no agenda at all.
 *
 * v4 saves are migrated rather than discarded — a run can be forty years deep
 * by the time a version changes, and throwing that away over an added field is
 * not a defensible thing to do to a player.
 */
const SAVE_VERSION = 5;
const MIGRATABLE_FROM = 4;

export interface SavedRun {
    version: typeof SAVE_VERSION;
    gameState: GameState;
    currentEvent: GameEvent | null;
    lastOutcome: DecisionOutcome | null;
    /** Which stage of the cabinet turn the player was on. */
    turnPhase?: TurnPhase;
}

export const hasSavedRun = () => localStorage.getItem(ACTIVE_RUN_KEY) !== null;

export const saveRun = (save: Omit<SavedRun, 'version'>) => {
    const payload: SavedRun = { version: SAVE_VERSION, ...save };
    localStorage.setItem(ACTIVE_RUN_KEY, JSON.stringify(payload));
};

/** Bring a v4 run forward: seed the territorial layer it never had. */
const migrateFromV4 = (state: GameState): GameState => ({
    ...state,
    provinces: state.provinces ?? createProvinces(),
    provinceBudget: state.provinceBudget ?? 0,
    achievements: state.achievements ?? [],
});

export const loadRun = (): SavedRun | null => {
    try {
        const stored = localStorage.getItem(ACTIVE_RUN_KEY);
        if (!stored) return null;

        const parsed = JSON.parse(stored) as Partial<SavedRun>;
        if (!parsed.gameState?.country || !parsed.gameState.countryName) return null;

        const version = parsed.version as number | undefined;
        if (version !== SAVE_VERSION && version !== MIGRATABLE_FROM) return null;

        return {
            ...(parsed as SavedRun),
            version: SAVE_VERSION,
            gameState:
                version === SAVE_VERSION ? parsed.gameState : migrateFromV4(parsed.gameState),
        };
    } catch {
        return null;
    }
};

export const clearSavedRun = () => localStorage.removeItem(ACTIVE_RUN_KEY);
