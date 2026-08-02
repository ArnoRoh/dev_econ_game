import type { DecisionOutcome, GameEvent, GameState, TurnPhase } from './engine/types';
import { createProvinces } from './data/provinces';

const ACTIVE_RUN_KEY = 'dev_econ_active_run';
/**
 * v6 adds per-province development programmes (`works`).
 * v5 added the territorial layer and achievements.
 * v4 added the cabinet turn phase; v3 and earlier have no agenda at all.
 *
 * Old saves are migrated rather than discarded — a run can be forty years deep
 * by the time a version changes, and throwing that away over an added field is
 * not a defensible thing to do to a player. Migration chains, so a v4 save is
 * carried through v5 to v6 rather than needing its own path.
 */
const SAVE_VERSION = 6;
const MIGRATABLE_FROM = 4;

export interface SavedRun {
    version: typeof SAVE_VERSION;
    gameState: GameState;
    currentEvent: GameEvent | null;
    lastOutcome: DecisionOutcome | null;
    /** Which stage of the cabinet turn the player was on. */
    turnPhase?: TurnPhase;
}

/**
 * Whether there is a run that can actually be resumed.
 *
 * This deliberately does the full load rather than checking the key exists. A
 * stored payload that `loadRun` will refuse — one written by a newer build, or
 * by a version too old to migrate — would otherwise still put a Continue button
 * on the title screen, and pressing it lands the player on nothing at all.
 */
export const hasSavedRun = () => loadRun() !== null;

export const saveRun = (save: Omit<SavedRun, 'version'>) => {
    const payload: SavedRun = { version: SAVE_VERSION, ...save };
    localStorage.setItem(ACTIVE_RUN_KEY, JSON.stringify(payload));
};

/** v4 -> v5: seed the territorial layer the run never had. */
const migrateToV5 = (state: GameState): GameState => ({
    ...state,
    provinces: state.provinces ?? createProvinces(),
    provinceBudget: state.provinceBudget ?? 0,
    achievements: state.achievements ?? [],
});

/**
 * v5 -> v6: give every province an empty programme record.
 *
 * `works` is optional and absent already reads as "nothing built", so this is
 * belt-and-braces rather than strictly required — but the field is now part of
 * the stored shape, and leaving the version un-bumped is how a save format
 * quietly diverges from what the code believes it is reading.
 */
const migrateToV6 = (state: GameState): GameState => ({
    ...state,
    provinces: (state.provinces ?? createProvinces()).map(province => ({
        ...province,
        works: province.works ?? {},
    })),
});

/** Run a stored state forward through every migration newer than its version. */
const migrate = (state: GameState, from: number): GameState => {
    let next = state;
    if (from < 5) next = migrateToV5(next);
    if (from < 6) next = migrateToV6(next);
    return next;
};

export const loadRun = (): SavedRun | null => {
    try {
        const stored = localStorage.getItem(ACTIVE_RUN_KEY);
        if (!stored) return null;

        const parsed = JSON.parse(stored) as Partial<SavedRun>;
        if (!parsed.gameState?.country || !parsed.gameState.countryName) return null;

        const version = parsed.version as number | undefined;
        // A range, not two equality checks. Testing only against the current and
        // oldest-supported versions silently discards every save written by an
        // intermediate one — which is exactly what happens on the next bump, to
        // the runs of anyone who was mid-game when it shipped.
        if (typeof version !== 'number' || version < MIGRATABLE_FROM || version > SAVE_VERSION) {
            return null;
        }

        return {
            ...(parsed as SavedRun),
            version: SAVE_VERSION,
            gameState:
                version === SAVE_VERSION ? parsed.gameState : migrate(parsed.gameState, version),
        };
    } catch {
        return null;
    }
};

export const clearSavedRun = () => localStorage.removeItem(ACTIVE_RUN_KEY);
