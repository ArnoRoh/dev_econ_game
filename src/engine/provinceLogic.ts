import type { CountryStats, GameState, Province, ProvinceSummary, Terrain } from './types';

/** The unit the province-investment UI spends per click, in $M. */
export const INVESTMENT_STEP = 10;

// -- Development --
//
// Cumulative investment behaves like an infrastructure stock rather than a
// one-time gift: every year it exists it lifts development a little, but
// each additional $M contributes less than the last (a sqrt curve), so a
// single big transfer cannot buy a province out of its problems in one turn.
const DEVELOPMENT_INVESTMENT_RATE = 0.026;
// A more literate, better-administered country lifts every province's local
// capacity a little, independent of direct spending there.
const EDUCATION_DEVELOPMENT_COEFFICIENT = 0.01;
// Roads silt up, clinics run short of staff, markets lose to better-connected
// rivals. A province that receives nothing still loses a little ground every
// year -- this is the cost of neglect the mechanic is built to expose.
const BASE_DEVELOPMENT_DECAY = 0.22;
// How readily each terrain turns investment into measured development. A
// delta with an existing port and a coastal strip absorb capital fastest;
// dry savannah is the slowest to show a return on the same $M.
const TERRAIN_DEVELOPMENT_PACE: Record<Terrain, number> = {
    delta: 1.2,
    coast: 1.1,
    river: 1.0,
    highland: 0.9,
    forest: 0.85,
    border: 0.85,
    savannah: 0.7,
};

// -- Unrest --
//
// A province meaningfully below the national mean is the regional-grievance
// signal: falling behind your neighbours, not just falling behind in
// absolute terms, is what turns development gaps into politics.
const GRIEVANCE_UNREST_COEFFICIENT = 0.035;
// A weak national government is felt everywhere, but is not itself a
// province-level cost until stability drops below a functioning threshold.
const STABILITY_UNREST_THRESHOLD = 45;
const STABILITY_UNREST_COEFFICIENT = 0.035;
// A calm, confident centre lets provincial unrest relax a little even
// without local attention.
const STABILITY_RELIEF_THRESHOLD = 60;
const STABILITY_UNREST_RELIEF_COEFFICIENT = 0.02;
// The resource curse: valuable, extractable minerals with little local
// development to show for them concentrate resentment rather than
// prosperity, because the wealth leaves and the jobs mostly do not arrive.
const RESOURCE_CURSE_MINERAL_THRESHOLD = 50;
const RESOURCE_CURSE_UNREST_COEFFICIENT = 0.006;
// A province that has just received money can see it; the calming effect
// fades once the investment is a few years old.
const RECENT_INVESTMENT_WINDOW_YEARS = 2;
const RECENT_INVESTMENT_UNREST_RELIEF = 1.4;
// A border community answers to two capitals and profits from neither
// fully trusting it; grievances there compound faster than elsewhere.
const BORDER_UNREST_MULTIPLIER = 1.3;

const clampIndex = (value: number): number => Math.max(0, Math.min(100, value));

/**
 * Spend part of the province budget on one province. Refuses -- and returns
 * the same state reference, so callers can detect a no-op -- if the budget
 * cannot cover the amount or the province id is unknown.
 */
export function investInProvince(state: GameState, provinceId: string, amount: number): GameState {
    const provinces = state.provinces;
    const budget = state.provinceBudget ?? 0;

    if (!provinces || amount <= 0 || budget < amount) return state;

    const index = provinces.findIndex(province => province.id === provinceId);
    if (index === -1) return state;

    const nextProvinces = provinces.slice();
    const target = nextProvinces[index];
    nextProvinces[index] = {
        ...target,
        invested: target.invested + amount,
        lastInvestedYear: state.year,
    };

    return {
        ...state,
        provinces: nextProvinces,
        provinceBudget: budget - amount,
    };
}

/**
 * Advance every province by one simulated year. Development responds to the
 * province's own investment stock, terrain, and national education; unrest
 * responds to how the province sits relative to its peers, to national
 * stability, and to the resource curse. Pure and immutable: returns a new
 * state, or the same reference if there is nothing to tick.
 */
export function tickProvinces(state: GameState): GameState {
    const provinces = state.provinces;
    if (!provinces || provinces.length === 0) return state;

    const { stability, educationLevel } = state.country;

    // The regional-grievance signal is relative, so it is measured against
    // this year's starting spread across provinces, before any of them move.
    const meanDevelopment = provinces.reduce((sum, province) => sum + province.development, 0) / provinces.length;

    const nextProvinces = provinces.map(province => {
        const pace = TERRAIN_DEVELOPMENT_PACE[province.terrain];

        const investmentContribution = DEVELOPMENT_INVESTMENT_RATE * Math.sqrt(Math.max(0, province.invested)) * pace;
        const educationContribution = EDUCATION_DEVELOPMENT_COEFFICIENT * educationLevel;
        const development = clampIndex(
            province.development + investmentContribution + educationContribution - BASE_DEVELOPMENT_DECAY,
        );

        const developmentGap = Math.max(0, meanDevelopment - province.development);
        const grievancePressure = developmentGap * GRIEVANCE_UNREST_COEFFICIENT;

        const nationalWeaknessPressure = Math.max(0, STABILITY_UNREST_THRESHOLD - stability) * STABILITY_UNREST_COEFFICIENT;

        const lootableGap = Math.max(0, province.minerals - province.development);
        const resourceCursePressure = province.minerals > RESOURCE_CURSE_MINERAL_THRESHOLD
            ? lootableGap * RESOURCE_CURSE_UNREST_COEFFICIENT
            : 0;

        const terrainMultiplier = province.terrain === 'border' ? BORDER_UNREST_MULTIPLIER : 1;
        const pressure = (grievancePressure + nationalWeaknessPressure + resourceCursePressure) * terrainMultiplier;

        const recentlyInvested = province.lastInvestedYear !== undefined
            && state.year - province.lastInvestedYear <= RECENT_INVESTMENT_WINDOW_YEARS;
        const investmentRelief = recentlyInvested ? RECENT_INVESTMENT_UNREST_RELIEF : 0;

        const stabilityRelief = stability > STABILITY_RELIEF_THRESHOLD
            ? (stability - STABILITY_RELIEF_THRESHOLD) * STABILITY_UNREST_RELIEF_COEFFICIENT
            : 0;

        const unrest = clampIndex(province.unrest + pressure - investmentRelief - stabilityRelief);

        return { ...province, development, unrest };
    });

    return { ...state, provinces: nextProvinces };
}

// Extra annual treasury raised from the provinces, on top of advanceTurn's
// national tax revenue. Each province contributes a slice of the national
// economy weighted by its population share and how much of its own economy
// is developed enough to be taxed. Intended order of magnitude: a few tens
// of $M a turn at 1960 starting conditions (GDP 1000, mean development in
// the low twenties), rising toward the low hundreds of $M as provinces
// develop and national GDP grows across a run.
const PROVINCE_REVENUE_RATE = 0.11;

export function provinceRevenue(provinces: Province[], stats: CountryStats): number {
    return provinces.reduce((total, province) => {
        const taxableShare = stats.gdp * province.popShare * (province.development / 100);
        return total + taxableShare * PROVINCE_REVENUE_RATE;
    }, 0);
}

/** Roll the provinces up into the national summary the dashboard reads. */
export function summariseProvinces(provinces: Province[]): ProvinceSummary {
    if (provinces.length === 0) {
        return { meanDevelopment: 0, developmentGap: 0, meanUnrest: 0, neglectedId: null, restiveIds: [] };
    }

    const meanDevelopment = provinces.reduce((sum, province) => sum + province.development, 0) / provinces.length;
    const meanUnrest = provinces.reduce((sum, province) => sum + province.unrest, 0) / provinces.length;

    const developments = provinces.map(province => province.development);
    const developmentGap = Math.max(...developments) - Math.min(...developments);

    const neglected = provinces.reduce((worst, province) => (
        province.development < worst.development ? province : worst
    ));

    const restiveIds = provinces.filter(province => province.unrest > 60).map(province => province.id);

    return {
        meanDevelopment,
        developmentGap,
        meanUnrest,
        neglectedId: neglected.id,
        restiveIds,
    };
}
