import { worldEraFor } from '../data/worldEras.ts';
import type { WorldEra } from '../data/worldEras.ts';
import type { GameState, WorldPressure } from './types';

/**
 * How the world's conditions land on *this* republic.
 *
 * The era table says what the decade is like for everyone. This says what it is
 * like for a country with these exports, this industry and this debt — which is
 * the whole argument. A commodity slump is a rounding error to a manufacturing
 * economy and an emergency to a mining one, and the player chose which of those
 * to become twenty years earlier.
 *
 * Exposure is read off structure the player actually built, never off a flag
 * they were handed:
 *   - external debt relative to GDP decides how much a rate rise costs,
 *   - mineral endowment worked by extraction programmes decides commodity exposure,
 *   - the industrial corridor decides how much export demand matters.
 */

/** Debt above this share of GDP is where rate moves stop being survivable. */
const DEBT_STRESS_RATIO = 0.6;

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

/** 0-1: how much of the economy rides on what the republic digs up or grows. */
export const commodityExposure = (state: GameState): number => {
    const provinces = state.provinces ?? [];
    if (provinces.length === 0) return 0.3;

    const extractive = provinces.reduce((sum, province) => {
        const worked = province.works?.extraction ?? 0;
        // Endowment alone is potential; endowment plus extraction is exposure.
        return sum + (province.minerals / 100) * province.popShare * (1 + worked * 0.5);
    }, 0);

    return clamp01(extractive * 1.6);
};

/** 0-1: how much rides on foreign appetite for manufactures. */
export const exportExposure = (state: GameState): number =>
    clamp01((state.projectLevels.industry ?? 0) * 0.22 + (state.flags.export_oriented ? 0.25 : 0));

/** 0-1: how badly a change in the cost of money is felt. */
export const debtExposure = (state: GameState): number =>
    clamp01((state.country.externalDebt / Math.max(1, state.country.gdp)) / DEBT_STRESS_RATIO);

export function worldPressure(state: GameState, year: number = state.year): WorldPressure {
    const era: WorldEra = worldEraFor(year);

    const commodity = commodityExposure(state);
    const exports = exportExposure(state);
    const debt = debtExposure(state);

    // Indices are expressed against the 1960 baseline of 100, so the deviation
    // from 100 is the shock, and exposure decides what fraction of it lands.
    const commoditySwing = (era.commodityPrice - 100) / 100;
    const exportSwing = (era.exportDemand - 100) / 100;

    // Growth: a commodity or demand swing moves the economy in proportion to how
    // much of it is built on that trade. A diversified economy barely notices.
    const growthModifier = commoditySwing * commodity * 2.4 + exportSwing * exports * 2.4;

    // The cost of money is the era's rate. This replaces the flat 5% that made
    // 1976 and 1984 identical decades in which to be carrying foreign debt.
    const debtInterestRate = era.interestRate / 100;

    // Revenue from extractive provinces tracks the price of what comes out.
    const commodityRevenueMultiplier = 1 + commoditySwing * commodity;

    return {
        year,
        era: era.label,
        note: era.note,
        interestRate: era.interestRate,
        commodityPrice: era.commodityPrice,
        exportDemand: era.exportDemand,
        capitalAvailability: era.capitalAvailability,
        debtInterestRate,
        growthModifier,
        commodityRevenueMultiplier,
        commodityExposure: commodity,
        exportExposure: exports,
        debtExposure: debt,
    };
}

/**
 * The one-line reading shown on the dashboard.
 *
 * Deliberately qualitative: the dossier rule that no exact number may appear
 * before a decision applies to the world panel too, and "severe" is the honest
 * summary of an exposure the player can already see the components of.
 */
export const exposureVerdict = (pressure: WorldPressure): 'sheltered' | 'moderate' | 'severe' => {
    const worst = Math.max(pressure.commodityExposure, pressure.exportExposure, pressure.debtExposure);
    if (worst > 0.66) return 'severe';
    if (worst > 0.33) return 'moderate';
    return 'sheltered';
};
