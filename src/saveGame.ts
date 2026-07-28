import type { DecisionOutcome, GameEvent, GameState } from './engine/types';

const ACTIVE_RUN_KEY = 'dev_econ_active_run';
const SAVE_VERSION = 3;

export interface SavedRun {
    version: typeof SAVE_VERSION;
    gameState: GameState;
    currentEvent: GameEvent | null;
    lastOutcome: DecisionOutcome | null;
}

export const hasSavedRun = () => localStorage.getItem(ACTIVE_RUN_KEY) !== null;

export const saveRun = (save: Omit<SavedRun, 'version'>) => {
    const payload: SavedRun = { version: SAVE_VERSION, ...save };
    localStorage.setItem(ACTIVE_RUN_KEY, JSON.stringify(payload));
};

export const loadRun = (): SavedRun | null => {
    try {
        const stored = localStorage.getItem(ACTIVE_RUN_KEY);
        if (!stored) return null;

        const parsed = JSON.parse(stored) as Partial<SavedRun>;
        if (parsed.version !== SAVE_VERSION || !parsed.gameState?.country || !parsed.gameState.countryName) {
            return null;
        }

        return parsed as SavedRun;
    } catch {
        return null;
    }
};

export const clearSavedRun = () => localStorage.removeItem(ACTIVE_RUN_KEY);
