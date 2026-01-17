import type { GameState, CountryStats, EventOption, Artifact, GameEvent } from './types';

export const INITIAL_STATS: CountryStats = {
    gdp: 1000,
    gdpGrowthRate: 2.0,
    population: 5,
    stability: 50,
    eliteSatisfaction: 50,
    militaryPower: 30,
    educationLevel: 20,
    famineRisk: 10,
    internationalRelations: 50,
    genderEquality: 30, // Starts low
    externalDebt: 0,
};

export function createInitialState(artifacts: Artifact[]): GameState {
    let stats = { ...INITIAL_STATS };

    // Apply artifact modifiers
    artifacts.forEach(artifact => {
        Object.entries(artifact.effects).forEach(([key, value]) => {
            const k = key as keyof CountryStats;
            if (typeof stats[k] === 'number') {
                stats[k] = (stats[k] as number) + (value as number);
            }
        });
    });

    return {
        year: 1960,
        turn: 1,
        country: clampStats(stats),
        artifacts,
        gameOver: false,
        flags: {}, // Initialize empty flags
    };
}

export function advanceTurn(state: GameState): GameState {
    if (state.gameOver) return state;

    const newStats = { ...state.country };

    // Economic Simulation
    // Stability and Education drive growth potential
    // Elite satisfaction affects stability drift

    const baseGrowth = 2.0;
    const stabilityFactor = (newStats.stability - 50) * 0.05; // +/- 2.5%
    const educationFactor = newStats.educationLevel * 0.03; // +0% to 3%
    const debtServiceCost = (newStats.externalDebt / Math.max(1, newStats.gdp)) * 2.0; // Debt drag
    const targetGrowth = baseGrowth + stabilityFactor + educationFactor - debtServiceCost;

    // Growth rate creates momentum but trends toward target
    newStats.gdpGrowthRate = newStats.gdpGrowthRate * 0.8 + targetGrowth * 0.2;

    newStats.gdp = newStats.gdp * (1 + newStats.gdpGrowthRate / 100);

    // Debt Interest (5%)
    newStats.externalDebt = newStats.externalDebt * 1.05;

    // Dynamic Population Growth
    // Base 2% + Stability bonus - Education penalty - Gender Equality penalty (Demographic transition)
    const genderPopPenalty = newStats.genderEquality > 60 ? 0.05 * (newStats.genderEquality - 60) : 0;
    const popGrowthRate = 2.0 + (newStats.stability > 60 ? 0.5 : 0) - (newStats.educationLevel * 0.04) - genderPopPenalty;
    newStats.population = newStats.population * (1 + Math.max(0.1, popGrowthRate) / 100);

    // Gender Equality Bonus to GDP (Labor Force Participation)
    if (newStats.genderEquality > 50) {
        // Up to 1.5% bonus growth
        const genderBonus = ((newStats.genderEquality - 50) / 50) * 1.5;
        newStats.gdpGrowthRate += genderBonus;
    }

    // Entropy/Decay
    // Stability naturally decays if elites are unhappy
    if (newStats.eliteSatisfaction < 40) {
        newStats.stability -= 2;
    }

    // Famine risk increases if stability is low or GDP growth is negative
    if (newStats.gdpGrowthRate < 0) {
        newStats.famineRisk += 2;
    } else {
        newStats.famineRisk -= 1;
    }

    return {
        ...state,
        year: state.year + 1,
        turn: state.turn + 1,
        country: clampStats(newStats), // Helper also used here
    };
}

export function applyOption(state: GameState, option: EventOption): GameState {
    const newStats = { ...state.country };
    const newFlags = { ...state.flags };

    // Set new flags if any
    if (option.setFlags) {
        option.setFlags.forEach(flag => {
            newFlags[flag] = true;
        });
    }

    Object.entries(option.effects).forEach(([key, value]) => {
        const k = key as keyof CountryStats;
        if (typeof newStats[k] === 'number') {
            newStats[k] = (newStats[k] as number) + (value as number);
        }
    });

    return {
        ...state,
        country: clampStats(newStats),
        flags: newFlags,
    };
}

export const checkGameOver = (state: GameState): GameState => {
    const { stability, eliteSatisfaction, famineRisk, militaryPower } = state.country;

    // v1.3 Hard End Date
    if (state.year >= 2030) {
        return {
            ...state,
            gameOver: true,
            gameOverReason: 'Term Limit Reached (2030). History will judge your legacy.'
        };
    }

    // Coup Logic (Updated v1.3)
    // If military is too strong (>80), they are harder to control.
    const coupThreshold = militaryPower > 80 ? 55 : 40; // Needs higher stability to prevent coup if army is strong

    if (stability < coupThreshold && eliteSatisfaction < 30) {
        return {
            ...state,
            gameOver: true,
            gameOverReason: 'Military Coup d\'état'
        };
    }

    // Invasion Condition
    if (militaryPower < 10) {
        return { ...state, gameOver: true, gameOverReason: 'Invasion' };
    }

    // Famine Condition
    if (famineRisk > 90) {
        return { ...state, gameOver: true, gameOverReason: 'Famine' };
    }

    return state;
}

function clampStats(stats: CountryStats): CountryStats {
    const clamped = { ...stats };
    // Clamp 0-100 ranges
    (['stability', 'eliteSatisfaction', 'militaryPower', 'educationLevel', 'famineRisk', 'internationalRelations', 'genderEquality'] as const).forEach(key => {
        clamped[key] = Math.max(0, Math.min(100, clamped[key]));
    });
    return clamped;
}

// Weighted RNG for Event Selection
export const selectWeightedEvent = (events: GameEvent[], state: GameState): GameEvent => {
    const artifacts = state.artifacts;
    const flags = state.flags;
    // 1. Collect playing active tags
    const activeTags = new Set<string>();
    artifacts.forEach(a => a.tags?.forEach(t => activeTags.add(t)));

    // 2. Calculate weights (and filter by reqFlags)
    const candidates = events.filter(event => {
        // Filter out if requirements not met
        if (event.reqFlags) {
            const missingFlag = event.reqFlags.some(flag => !flags[flag]);
            if (missingFlag) return false;
        }

        // v1.9: Historical Timeline Logic
        if (event.minYear && state.year < event.minYear) return false;
        if (event.maxYear && state.year > event.maxYear) return false;

        return true;
    });

    const weightedEvents = candidates.map(event => {
        let weight = 1;
        // If event has a tag that matches an active artifact tag, boost weight
        if (event.tags?.some(tag => activeTags.has(tag))) {
            weight = 3; // 3x multiplier (Artifacts make relevant events much more likely)
        }
        return { event, weight };
    });

    // 3. Select based on weight
    const totalWeight = weightedEvents.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const item of weightedEvents) {
        random -= item.weight;
        if (random <= 0) return item.event;
    }

    return events[0]; // Fallback
};
