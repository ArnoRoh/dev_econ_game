import type { CountryStats, GameState, ProgrammeId, Province, ProvinceDelta, ProvinceSummary, Terrain } from './types';

/** The unit the province-investment UI spends per click, in $M. */
export const INVESTMENT_STEP = 10;

// -- Programmes --
//
// One allocation buys one programme. What separates them is not how much they
// cost but what the money turns into, so each converts its $M into a different
// mix of infrastructure stock, permanent local capacity, cash, and resentment.
//
// `stock` is how much of the spend behaves like the generic investment stock
// below -- roads are almost all stock, schools almost none.
const PROGRAMME_STOCK_SHARE: Record<ProgrammeId, number> = {
    roads: 1.15,
    schools: 0.2,
    extraction: 0.45,
    irrigation: 0.95,
};

// Repeat builds of the same programme in the same province run into the same
// wall real programmes do: the second clinic serves the people the first one
// missed, the tenth is staffing a district that already has clinics. Everything
// below is therefore square-root in the number built and hard-capped -- without
// that, one programme repeated forever beats every mixed strategy, which is the
// opposite of the choice this system exists to pose.
const diminishing = (built: number, perBuild: number, cap: number): number =>
    Math.min(cap, perBuild * Math.sqrt(Math.max(0, built)));

// Each school raises how much development this province gets out of every later
// allocation -- nothing on its own, a multiplier on everything else.
const SCHOOL_PACE_BONUS = 0.11;
const SCHOOL_PACE_CAP = 0.45;
// ...and a school is felt locally every year it stays open, not once.
const SCHOOL_UNREST_RELIEF = 0.3;
const SCHOOL_RELIEF_CAP = 1.1;

// A licensed concession pays a signature bonus at once and a royalty every year
// after, both scaled by how rich the seams still are.
const EXTRACTION_SIGNING_BONUS = 18;
const EXTRACTION_ANNUAL_ROYALTY = 0.04;
// A province has only so many seams worth chartering. Without a ceiling the
// royalties compound against a growing GDP and the concession becomes an
// infinite-money press that makes every other decision in the game irrelevant.
const MAX_LICENCES_PER_PROVINCE = 3;
// The seams also run down. This is the whole lesson of the resource curse in one
// line: the cash is temporary, the resentment is not, and the endowment that paid
// for it does not come back.
const MINERAL_DEPLETION_PER_LICENCE = 0.5;
// And it deepens the curse while it lasts: the wealth is visibly leaving, which
// is the part of extraction the treasury line never shows.
const EXTRACTION_UNREST_ON_SIGNING = 6;
const EXTRACTION_CURSE_MULTIPLIER = 0.55;

// Watered land is the one programme that reliably buys development and calm at
// the same time -- which is why it is gated on there being farmland to water.
const IRRIGATION_UNREST_RELIEF = 0.32;
const IRRIGATION_RELIEF_CAP = 1;

const worksBuilt = (province: Province, id: ProgrammeId): number => province.works?.[id] ?? 0;

/** Whether another licence can be chartered here. The UI reads this too. */
export const canLicenceMore = (province: Province): boolean =>
    worksBuilt(province, 'extraction') < MAX_LICENCES_PER_PROVINCE;

export const LICENCE_CAP = MAX_LICENCES_PER_PROVINCE;

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
 * Spend one allocation on a named programme in one province.
 *
 * Refuses -- returning the same state reference, so callers can detect a no-op --
 * if the budget cannot cover the cost or the province id is unknown. It does not
 * re-check the endowment gate: that is the UI's job, and an already-licensed mine
 * whose seams have since been written down should not become unbuildable.
 */
export function buildProgramme(
    state: GameState,
    provinceId: string,
    programmeId: ProgrammeId,
    cost: number,
): GameState {
    const provinces = state.provinces;
    const budget = state.provinceBudget ?? 0;

    if (!provinces || cost <= 0 || budget < cost) return state;

    const index = provinces.findIndex(province => province.id === provinceId);
    if (index === -1) return state;

    const target = provinces[index];
    const built = worksBuilt(target, programmeId);

    if (programmeId === 'extraction' && !canLicenceMore(target)) return state;

    // Extraction is the only programme that pays on signature rather than only
    // through the annual tick, and the only one that costs unrest up front.
    const richness = target.minerals / 100;
    const signingBonus = programmeId === 'extraction' ? EXTRACTION_SIGNING_BONUS * richness : 0;
    const signingUnrest = programmeId === 'extraction' ? EXTRACTION_UNREST_ON_SIGNING : 0;

    const nextProvinces = provinces.slice();
    nextProvinces[index] = {
        ...target,
        invested: target.invested + cost * PROGRAMME_STOCK_SHARE[programmeId],
        lastInvestedYear: state.year,
        unrest: clampIndex(target.unrest + signingUnrest),
        works: { ...target.works, [programmeId]: built + 1 },
    };

    return {
        ...state,
        provinces: nextProvinces,
        provinceBudget: budget - cost,
        treasury: state.treasury + signingBonus,
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
        // Schools do not build anything themselves; they raise the rate at which
        // this province converts everything else into measured development.
        const pace = TERRAIN_DEVELOPMENT_PACE[province.terrain]
            + diminishing(worksBuilt(province, 'schools'), SCHOOL_PACE_BONUS, SCHOOL_PACE_CAP);

        const investmentContribution = DEVELOPMENT_INVESTMENT_RATE * Math.sqrt(Math.max(0, province.invested)) * pace;
        const educationContribution = EDUCATION_DEVELOPMENT_COEFFICIENT * educationLevel;
        const development = clampIndex(
            province.development + investmentContribution + educationContribution - BASE_DEVELOPMENT_DECAY,
        );

        const developmentGap = Math.max(0, meanDevelopment - province.development);
        const grievancePressure = developmentGap * GRIEVANCE_UNREST_COEFFICIENT;

        const nationalWeaknessPressure = Math.max(0, STABILITY_UNREST_THRESHOLD - stability) * STABILITY_UNREST_COEFFICIENT;

        // Licensing the seams does not create the curse, but it sharpens it: the
        // extraction is now visible, contracted, and demonstrably someone else's.
        const lootableGap = Math.max(0, province.minerals - province.development);
        const curseIntensity = 1 + worksBuilt(province, 'extraction') * EXTRACTION_CURSE_MULTIPLIER;
        const resourceCursePressure = province.minerals > RESOURCE_CURSE_MINERAL_THRESHOLD
            ? lootableGap * RESOURCE_CURSE_UNREST_COEFFICIENT * curseIntensity
            : 0;

        const terrainMultiplier = province.terrain === 'border' ? BORDER_UNREST_MULTIPLIER : 1;
        const pressure = (grievancePressure + nationalWeaknessPressure + resourceCursePressure) * terrainMultiplier;

        const recentlyInvested = province.lastInvestedYear !== undefined
            && state.year - province.lastInvestedYear <= RECENT_INVESTMENT_WINDOW_YEARS;
        const investmentRelief = recentlyInvested ? RECENT_INVESTMENT_UNREST_RELIEF : 0;

        const stabilityRelief = stability > STABILITY_RELIEF_THRESHOLD
            ? (stability - STABILITY_RELIEF_THRESHOLD) * STABILITY_UNREST_RELIEF_COEFFICIENT
            : 0;

        // Standing local relief, unlike investmentRelief, does not lapse: a clinic
        // that is still open is still felt.
        const programmeRelief = diminishing(worksBuilt(province, 'schools'), SCHOOL_UNREST_RELIEF, SCHOOL_RELIEF_CAP)
            + diminishing(worksBuilt(province, 'irrigation'), IRRIGATION_UNREST_RELIEF, IRRIGATION_RELIEF_CAP);

        const unrest = clampIndex(
            province.unrest + pressure - investmentRelief - stabilityRelief - programmeRelief,
        );

        // Chartered seams run down as they are worked, so the royalty stream and
        // the curse pressure both decay toward an exhausted province.
        const minerals = clampIndex(
            province.minerals - worksBuilt(province, 'extraction') * MINERAL_DEPLETION_PER_LICENCE,
        );

        return { ...province, development, unrest, minerals };
    });

    return { ...state, provinces: nextProvinces };
}

// -- Provincial pressure on the centre --
//
// Without this the territorial layer is decorative: a player could let every
// province rot and the republic would never notice, and licensing every seam in
// the country would be free money. The dashboard already tells the player a
// widening regional gap "turns regional grievance into a secession problem" --
// this is the function that makes that sentence true.
//
// Weighted by population, because a restive tenth of the country is a policing
// problem and a restive half is the end of the government.
const RESTIVE_STABILITY_DRAG = 9;
// A gap this wide is normal in a developing economy and costs nothing; past it,
// the comparison itself becomes the grievance.
const GAP_TOLERANCE = 25;
const GAP_STABILITY_DRAG = 0.05;
// A country whose provinces are all quiet governs more easily than one holding
// itself together, and should feel like it.
const CALM_UNREST_CEILING = 25;
const CALM_STABILITY_BONUS = 0.9;

/**
 * Apply the provinces' condition back onto the national picture. Call once a
 * year, after `tickProvinces`. Returns the same state reference when there are
 * no provinces, so pre-territorial saves are unaffected.
 */
export function applyProvincialPressure(state: GameState): GameState {
    const provinces = state.provinces;
    if (!provinces || provinces.length === 0) return state;

    const summary = summariseProvinces(provinces);
    const restiveShare = provinces
        .filter(province => province.unrest > 60)
        .reduce((sum, province) => sum + province.popShare, 0);

    const restiveDrag = restiveShare * RESTIVE_STABILITY_DRAG;
    const gapDrag = Math.max(0, summary.developmentGap - GAP_TOLERANCE) * GAP_STABILITY_DRAG;
    const calmBonus = restiveShare === 0 && summary.meanUnrest < CALM_UNREST_CEILING
        ? CALM_STABILITY_BONUS
        : 0;

    const delta = calmBonus - restiveDrag - gapDrag;
    if (delta === 0) return state;

    return {
        ...state,
        country: {
            ...state.country,
            stability: clampIndex(state.country.stability + delta),
        },
    };
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
        // Royalties are the point of a concession: they arrive whether or not the
        // district ever develops enough to be worth taxing, which is exactly what
        // makes extraction tempting and exactly what makes it a trap.
        const royalties = worksBuilt(province, 'extraction')
            * EXTRACTION_ANNUAL_ROYALTY
            * stats.gdp
            * (province.minerals / 100)
            * province.popShare;
        return total + taxableShare * PROVINCE_REVENUE_RATE + royalties;
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

/**
 * Compute year-over-year changes in province condition.
 *
 * Returns a map keyed by province id, one entry per province where at least one
 * field changed by 0.5 or more (float noise suppression). When `previous` is
 * undefined or empty — the first year, or a province new to this run —
 * returns an empty object. Never throws.
 *
 * Values are rounded to the nearest integer so they display cleanly on the map,
 * matching how province development is shown throughout.
 */
export function provinceDeltas(
    current: Province[],
    previous: Province[] | undefined,
): Record<string, ProvinceDelta> {
    if (!previous || previous.length === 0) {
        return {};
    }

    // Index previous provinces by id for O(1) lookup
    const previousById = new Map(previous.map(p => [p.id, p]));

    const deltas: Record<string, ProvinceDelta> = {};
    const epsilon = 0.5;

    current.forEach(curr => {
        const prev = previousById.get(curr.id);
        if (!prev) return;

        const devDelta = curr.development - prev.development;
        const unrestDelta = curr.unrest - prev.unrest;
        const mineralsDelta = curr.minerals - prev.minerals;

        // Only report if at least one field changed meaningfully
        if (
            Math.abs(devDelta) >= epsilon ||
            Math.abs(unrestDelta) >= epsilon ||
            Math.abs(mineralsDelta) >= epsilon
        ) {
            deltas[curr.id] = {
                development: Math.round(devDelta),
                unrest: Math.round(unrestDelta),
                minerals: Math.round(mineralsDelta),
            };
        }
    });

    return deltas;
}
