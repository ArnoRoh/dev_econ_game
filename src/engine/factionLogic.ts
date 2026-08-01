import { FACTIONS } from '../data/factions.ts';
import { CHARACTERS } from '../data/characters.ts';
import type {
    CharacterId,
    CharacterState,
    FactionEffect,
    FactionId,
    FactionState,
    GameState,
} from './types';

const clampFactionValue = (value: number): number => Math.max(0, Math.min(100, value));

export const INITIAL_FACTION_STATES: Record<FactionId, FactionState> = {
    military: {
        support: 62,
        power: 55,
        radicalization: 18,
        promisesOwed: [],
        grievances: [],
    },
    labor: {
        support: 56,
        power: 48,
        radicalization: 20,
        promisesOwed: [],
        grievances: [],
    },
    business: {
        support: 58,
        power: 60,
        radicalization: 15,
        promisesOwed: [],
        grievances: [],
    },
    provincial: {
        support: 52,
        power: 42,
        radicalization: 24,
        promisesOwed: [],
        grievances: [],
    },
};

export const INITIAL_CHARACTER_STATES: Record<CharacterId, CharacterState> = {
    finance_minister: {
        trust: 58,
        influence: 60,
        loyalty: 72,
        memories: [],
    },
    army_chief: {
        trust: 55,
        influence: 65,
        loyalty: 78,
        memories: [],
    },
    labor_leader: {
        trust: 52,
        influence: 50,
        loyalty: 64,
        memories: [],
    },
    provincial_chair: {
        trust: 50,
        influence: 44,
        loyalty: 60,
        memories: [],
    },
};

export function createInitialFactionStates(): Record<FactionId, FactionState> {
    return Object.fromEntries(
        FACTIONS.map(faction => {
            const state = INITIAL_FACTION_STATES[faction.id];
            return [faction.id, { ...state, promisesOwed: [...state.promisesOwed], grievances: [...state.grievances] }];
        }),
    ) as Record<FactionId, FactionState>;
}

export function createInitialCharacterStates(): Record<CharacterId, CharacterState> {
    return Object.fromEntries(
        CHARACTERS.map(character => {
            const state = INITIAL_CHARACTER_STATES[character.id];
            return [character.id, { ...state, memories: [...state.memories] }];
        }),
    ) as Record<CharacterId, CharacterState>;
}

export function applyFactionEffects(state: GameState, effects: FactionEffect[]): GameState {
    const factions = state.factions ?? createInitialFactionStates();
    const nextFactions = { ...factions };

    effects.forEach(effect => {
        const current = nextFactions[effect.factionId] ?? {
            support: 50,
            power: 50,
            radicalization: 0,
            promisesOwed: [],
            grievances: [],
        };

        nextFactions[effect.factionId] = {
            ...current,
            support: clampFactionValue(current.support + (effect.support ?? 0)),
            power: clampFactionValue(current.power + (effect.power ?? 0)),
            radicalization: clampFactionValue(current.radicalization + (effect.radicalization ?? 0)),
            promisesOwed: [...current.promisesOwed],
            grievances: effect.grievance
                ? [...current.grievances, effect.grievance]
                : [...current.grievances],
        };
    });

    return { ...state, factions: nextFactions };
}

/**
 * Annual relationship drift.
 *
 * Without this the political model only ever decays: every ignored proposal and
 * every hard choice subtracts, and nothing restores. Real coalitions re-form —
 * grievances fade if the country is calm and nothing new is added to them.
 * A visibly failing state reverses the effect and radicalises instead.
 */
export function driftFactions(state: GameState): GameState {
    const factions = state.factions;
    if (!factions) return state;

    const { stability } = state.country;
    const calm = stability >= 45;
    const failing = stability < 30;

    const next = Object.fromEntries(
        Object.entries(factions).map(([id, faction]) => {
            // Support decays toward the midpoint rather than toward zero.
            const pull = calm ? 1.0 : 0.4;
            const gap = 50 - faction.support;
            const support = faction.support + Math.sign(gap) * Math.min(pull, Math.abs(gap));

            const radicalization = failing
                ? faction.radicalization + 1.5
                : Math.max(0, faction.radicalization - (calm ? 1.5 : 0.5));

            return [
                id,
                {
                    ...faction,
                    support: clampFactionValue(support),
                    radicalization: clampFactionValue(radicalization),
                    // Old grievances stop being cited once the relationship recovers.
                    grievances:
                        calm && faction.grievances.length > 3
                            ? faction.grievances.slice(-3)
                            : faction.grievances,
                },
            ];
        }),
    ) as Record<FactionId, FactionState>;

    return { ...state, factions: next };
}

export function applyCharacterMemory(state: GameState, characterId: CharacterId, memory: string): GameState {
    const characters = state.characters ?? createInitialCharacterStates();
    const character = characters[characterId] ?? {
        trust: 50,
        influence: 50,
        loyalty: 50,
        memories: [],
    };

    return {
        ...state,
        characters: {
            ...characters,
            [characterId]: {
                ...character,
                memories: [...character.memories, memory],
            },
        },
    };
}

export { clampFactionValue };
