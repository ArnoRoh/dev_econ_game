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
