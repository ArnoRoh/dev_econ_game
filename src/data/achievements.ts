import type { GameState } from '../engine/types';

export interface AchievementDef {
    id: string;
    name: string;
    /** One line, shown when earned. Dry and specific, never congratulatory fluff. */
    description: string;
    /** True when the player has earned it. Must be a pure read of state. */
    earned: (state: GameState) => boolean;
    /** Hidden until earned — for the darker or spoiler-ish ones. */
    secret?: boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
    {
        id: 'prosperous_nation',
        name: 'Prosperous Nation',
        description: 'GDP per capita exceeded $1,200.',
        earned: state => {
            const gdpPerCapita = (state.country.gdp * 1_000_000) / (state.country.population * 1_000_000);
            return gdpPerCapita >= 1200;
        },
    },
    {
        id: 'wealthy_republic',
        name: 'Wealthy Republic',
        description: 'GDP per capita exceeded $2,000.',
        earned: state => {
            const gdpPerCapita = (state.country.gdp * 1_000_000) / (state.country.population * 1_000_000);
            return gdpPerCapita >= 2000;
        },
    },
    {
        id: 'educated_populace',
        name: 'Educated Populace',
        description: 'Education level sustained above 65% for the entire decade of the 2010s.',
        earned: state => {
            const snapshots = state.economicHistory ?? [];
            const twenty10s = snapshots.filter(s => s.year >= 2010 && s.year <= 2019);
            return twenty10s.length > 0 && twenty10s.every(s => s.educationLevel > 65);
        },
    },
    {
        id: 'gender_parity',
        name: 'Gender Parity',
        description: 'Gender equality surpassed 70%.',
        earned: state => state.country.genderEquality >= 70,
    },
    {
        id: 'hunger_banished',
        name: 'Hunger Banished',
        description: 'Famine risk fell below 5%.',
        earned: state => state.country.famineRisk < 5,
    },
    {
        id: 'political_equilibrium',
        name: 'Political Equilibrium',
        description: 'All four factions held support above 60% simultaneously.',
        earned: state => {
            const factions = state.factions;
            if (!factions) return false;
            return (
                (factions.military?.support ?? 50) > 60 &&
                (factions.labor?.support ?? 50) > 60 &&
                (factions.business?.support ?? 50) > 60 &&
                (factions.provincial?.support ?? 50) > 60
            );
        },
    },
    {
        id: 'full_term_served',
        name: 'Full Term Served',
        description: 'Reached 2030 without collapse.',
        earned: state => state.year >= 2030 && !state.gameOver,
    },
    {
        id: 'promise_keeper',
        name: 'Promise Keeper',
        description: 'Kept five or more public commitments.',
        earned: state => {
            const promises = state.promises ?? [];
            return promises.filter(p => p.status === 'kept').length >= 5;
        },
    },
    {
        id: 'promise_breaker',
        name: 'Promise Breaker',
        description: 'Broke five or more public commitments.',
        earned: state => {
            const promises = state.promises ?? [];
            return promises.filter(p => p.status === 'broken').length >= 5;
        },
    },
    {
        id: 'scholar',
        name: 'Scholar',
        description: 'Answered seven of the nine knowledge checks correctly.',
        // answeredChecks records attempts, not correctness, and there are only
        // nine checks in the game — the previous threshold of ten made this
        // unearnable. Correct answers are tallied per concept instead.
        earned: state => {
            const progress = Object.values(state.conceptProgress ?? {});
            const correct = progress.reduce(
                (sum, entry) => sum + (entry?.correctKnowledgeChecks ?? 0),
                0,
            );
            return correct >= 7;
        },
    },
    {
        id: 'polymath',
        name: 'Polymath',
        description: 'Encountered all nine economic concepts in the curriculum.',
        earned: state => {
            const progress = state.conceptProgress ?? {};
            const concepts = [
                'land_tenure',
                'green_revolution',
                'import_substitution',
                'export_orientation',
                'infant_industry',
                'labor_standards',
                'dutch_disease',
                'sovereign_wealth_fund',
                'resource_curse',
            ] as const;
            return concepts.every(id => (progress[id]?.exposures ?? 0) > 0);
        },
    },
    {
        id: 'territorial_integrity',
        name: 'Territorial Integrity',
        description: 'Every province reached development level 50 or above.',
        earned: state => {
            const provinces = state.provinces;
            if (!provinces || provinces.length === 0) return false;
            return provinces.every(p => p.development >= 50);
        },
    },
    {
        id: 'civil_peace',
        name: 'Civil Peace',
        description: 'Maintained no province above 60% unrest at any point in the final five years.',
        earned: state => {
            const provinces = state.provinces;
            if (!provinces || provinces.length === 0) return false;
            return provinces.every(p => p.unrest <= 60);
        },
    },
    {
        id: 'green_steward',
        name: 'Green Steward',
        description: 'Activated the green revolution and spread it across programme boundaries.',
        earned: state => {
            const flags = state.flags;
            return (
                flags.green_revolution_active &&
                (flags.green_package_public || flags.green_package_commercial) &&
                ((flags.harvest_gains_shared || flags.harvest_surplus_reinvested) &&
                    (flags.smallholder_credit_guaranteed || flags.cooperative_extension_built))
            );
        },
    },
    {
        id: 'sovereign_wealth',
        name: 'Sovereign Wealth',
        description: 'Established a sovereign wealth fund and still held it in 1985.',
        // Nothing records the year a flag was set, so a genuine "held for five
        // years" test is not available. Anchored to a date instead, which is
        // measurable and means the same thing in practice: the fund survived
        // the decade in which the temptation to raid it is greatest.
        earned: state => Boolean(state.flags.sovereign_fund_established) && state.year >= 1985,
    },
    {
        id: 'industrial_power',
        name: 'Industrial Power',
        description: 'Launched industrial strategy and saw three successive export shipments diversified.',
        earned: state => {
            const flags = state.flags;
            return (
                flags.industrial_strategy_launched &&
                (flags.isi_tariffs_enacted || flags.export_zones_established) &&
                flags.export_market_diversified &&
                flags.industrial_compact_formalized
            );
        },
    },
    {
        id: 'debt_dodger',
        name: 'Debt Dodger',
        description: 'External debt stayed below $50 million across every year still on record.',
        secret: true,
        earned: state => {
            const snapshots = state.economicHistory ?? [];
            return snapshots.length > 0 && snapshots.every(s => s.externalDebt < 50);
        },
    },
    {
        id: 'austerity_survived',
        name: 'Austerity Survived',
        description: 'Endured an IMF programme and emerged without default.',
        secret: true,
        earned: state => {
            const flags = state.flags;
            return flags.imf_program && !flags.broke_imf_deal;
        },
    },
    {
        id: 'famine_scar',
        name: 'Famine Scar',
        description: 'Navigated famine without halting the state apparatus.',
        secret: true,
        earned: state => {
            const snapshots = state.economicHistory ?? [];
            return (
                snapshots.some(s => s.famineRisk > 75) &&
                !state.gameOver
            );
        },
    },
    {
        id: 'authoritarian_gamble',
        name: 'Authoritarian Gamble',
        description: 'Took an authoritarian turn and survived to 2030.',
        secret: true,
        earned: state => {
            return state.flags.authoritarian_turn && state.year >= 2030;
        },
    },
];
