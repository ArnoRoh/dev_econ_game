import type {
    ConceptId,
    DelayedConsequenceSpec,
    EducationalPolicyOption,
    GameState,
} from '../engine/types';

/**
 * The world intervening, on its own schedule, in a session of its own.
 *
 * The annual event corpus already contained the century's great shocks — the
 * 1973 oil crisis, IMF conditionality, the bread riots that followed it. They
 * arrived as `isGeneric` proposals: one card among four, outranked by whatever
 * arc step happened to be live, and declinable for the price of a faction
 * grievance. A player could sit out the oil shock.
 *
 * A crisis is not agenda business. It suspends the agenda, takes the whole
 * session, and cannot be declined — the only choice is which way to answer it.
 *
 * Two properties make these more than set dressing:
 *
 * 1. `severity` reads the run's *structure*, not a die roll. The same crisis is
 *    a bad quarter for a diversified republic and an extinction event for one
 *    that borrowed abroad against a single commodity.
 * 2. They are wired to each other. Borrowing into the 1973 glut is the cheapest
 *    money in the campaign and sets `petrodollar_debt`; the 1982 crisis reads
 *    that flag and is materially worse for having it. A nine-year fuse the
 *    player lit themselves, and the 1973 dossier says so in as many words.
 */

export type SeverityLevel = 'contained' | 'serious' | 'severe';

export interface CrisisSeverity {
    level: SeverityLevel;
    /** Shown above the options: why this republic in particular is here. */
    reading: string;
    /** Scales the chosen option's effects. 1 = as authored. */
    multiplier: number;
}

export interface WorldCrisis {
    id: string;
    /** Session this preempts; must match a chapter in `chapters.ts`. */
    chapterIndex: number;
    year: number;
    title: string;
    /** What has happened, out in the world. */
    dispatch: string;
    /** Why it works the way it does. */
    theory: string;
    conceptIds: ConceptId[];
    sourceIds: string[];
    severity: (state: GameState) => CrisisSeverity;
    options: EducationalPolicyOption[];
    /** Used only if a crisis is somehow left unanswered. */
    ignoreOutcome: DelayedConsequenceSpec;
    tags?: string[];
}

const debtRatio = (state: GameState): number =>
    state.country.externalDebt / Math.max(1, state.country.gdp);

const mineralWeight = (state: GameState): number => {
    const provinces = state.provinces ?? [];
    if (provinces.length === 0) return 0.3;
    return provinces.reduce(
        (sum, province) => sum + (province.minerals / 100) * province.popShare,
        0,
    );
};

export const WORLD_CRISES: WorldCrisis[] = [
    {
        id: 'crisis_oil_1973',
        chapterIndex: 6,
        year: 1973,
        title: 'The Oil Shock',
        dispatch:
            'OPEC has quadrupled the posted price of crude. The fuel import bill for the coming year now exceeds what the republic earns from every export combined. Queues have formed at filling stations in the capital, the power stations have six weeks of reserve, and the haulage that moves the harvest to the port runs on diesel the treasury cannot currently pay for.',
        theory:
            'For an economy that imports its energy, an oil shock is a terms-of-trade shock: the same basket of exports now buys far less of what the country must buy. There is no domestic policy that makes the bill smaller — the only question is who absorbs it.\n\nThe money to defer it is unusually available. Oil revenues are being deposited in Western banks faster than those banks can lend them, and they are looking for sovereign borrowers. Rates are low and, against the decade\'s inflation, close to negative in real terms.\n\nThis is the trap the record is clearest about. The loans of the 1970s were contracted at floating rates by governments reasoning, correctly, that money had never been cheaper. When the United States raised rates to break inflation at the end of the decade, the same debt repriced into an economy earning less for its exports. Borrowing here is not a mistake. Borrowing here without a plan for what happens when the rate resets is.',
        conceptIds: ['import_substitution'],
        sourceIds: ['hamilton_1983_oil_macroeconomy', 'krugman_1988_debt_overhang'],
        tags: ['crisis', 'finance', 'history'],
        severity: state => {
            const industry = state.projectLevels.industry ?? 0;
            if (industry >= 2 && state.treasury > 120) {
                return {
                    level: 'contained',
                    reading: 'The industrial corridor gives the republic something to sell into the shock, and the treasury can carry a quarter of it without borrowing.',
                    multiplier: 0.75,
                };
            }
            if (state.treasury < 60) {
                return {
                    level: 'severe',
                    reading: 'The treasury cannot cover a single quarter of the new bill. Whatever is decided here is decided under duress, and the lenders know it.',
                    multiplier: 1.3,
                };
            }
            return {
                level: 'serious',
                reading: 'The republic can absorb one bad year. It cannot absorb two, and nobody is forecasting one.',
                multiplier: 1,
            };
        },
        options: [
            {
                id: 'oil_borrow_petrodollars',
                text: 'Borrow abroad and hold the fuel price',
                rationale:
                    'The banks are lending at rates no decade has offered before. Holding the pump price protects the harvest, the factories and the government — for as long as the terms last.',
                immediateNarrative:
                    'The syndicate is arranged within weeks and the queues disappear. Ministers note privately that the loan is floating-rate, and that the alternative was a winter without diesel. The finance ministry files the paperwork under a decade that will not last.',
                effects: { stability: 6, gdpGrowthRate: 0.3, externalDebt: 220 },
                treasuryEffect: 90,
                factionEffects: [
                    { factionId: 'business', support: 6 },
                    { factionId: 'labor', support: 5 },
                    { factionId: 'military', support: 2 },
                ],
                forecasts: [
                    {
                        advisorId: 'finance_minister',
                        summary: 'Credit is cheaper than it has ever been and the shock is a passing one. The sensible course is to bridge it.',
                        predictedDirection: 'up',
                        confidence: 'high',
                        affectedMetric: 'gdpGrowthRate',
                        hiddenBias: 'Treats the current rate as permanent. Says nothing about what the loan costs if rates reset.',
                    },
                    {
                        advisorId: 'provincial_chair',
                        summary: 'Fuel reaches the districts and the harvest moves. What the loan costs later is a question for later.',
                        predictedDirection: 'up',
                        confidence: 'medium',
                        affectedMetric: 'stability',
                    },
                ],
                conceptIds: ['import_substitution'],
                sourceIds: ['krugman_1988_debt_overhang'],
                delayedConsequences: [
                    {
                        id: 'petrodollar_terms_hold',
                        delayTurns: 1,
                        headline: 'The Loan Performs',
                        narrative:
                            'Servicing is comfortable, the economy has kept moving, and the decision looks like competence. The rate is still floating.',
                        effects: { eliteSatisfaction: 4, stability: 2 },
                        conceptIds: ['import_substitution'],
                    },
                ],
                setFlags: ['petrodollar_debt'],
            },
            {
                id: 'oil_pass_through',
                text: 'Pass the price through to consumers',
                rationale:
                    'The bill is real and someone pays it. Paying it now, in the open, keeps the republic\'s balance sheet clean at the cost of a hard year.',
                immediateNarrative:
                    'Pump prices triple overnight. Transport strikes follow within the month, the cost of moving grain doubles, and the government spends its credibility rather than its reserves. The books, at least, still balance.',
                effects: { stability: -14, gdpGrowthRate: -0.9, famineRisk: 6, eliteSatisfaction: -6 },
                factionEffects: [
                    { factionId: 'labor', support: -12, radicalization: 8 },
                    { factionId: 'business', support: -4 },
                    { factionId: 'provincial', support: -6 },
                ],
                forecasts: [
                    {
                        advisorId: 'finance_minister',
                        summary: 'Painful and correct. The republic ends the decade owing nothing it cannot pay.',
                        predictedDirection: 'down',
                        confidence: 'high',
                        affectedMetric: 'stability',
                    },
                    {
                        advisorId: 'labor_leader',
                        summary: 'You are asking people who walk to work to absorb a shock they did not cause. They will not absorb it quietly.',
                        predictedDirection: 'stronglyDown',
                        confidence: 'high',
                        affectedMetric: 'stability',
                    },
                ],
                conceptIds: ['import_substitution'],
                sourceIds: ['hamilton_1983_oil_macroeconomy'],
                delayedConsequences: [
                    {
                        id: 'clean_books_1970s',
                        delayTurns: 2,
                        headline: 'The Republic Enters the Eighties Solvent',
                        narrative:
                            'The hard year cost a great deal of political capital. It also means that when the cost of money triples, the republic is not on the wrong side of it.',
                        effects: { stability: 5, internationalRelations: 6 },
                        conceptIds: ['import_substitution'],
                    },
                ],
                setFlags: ['absorbed_oil_shock'],
            },
            {
                id: 'oil_ration',
                text: 'Ration fuel and prioritise by sector',
                rationale:
                    'Allocate scarce fuel to the harvest, the power stations and the army first. It controls the bill without borrowing, and it puts the state in the business of deciding who gets to move.',
                immediateNarrative:
                    'Coupons are issued and a licensing office opens in every province. Agriculture and the grid keep running. Within a season there is a functioning black market in coupons, and the officials who issue them have become people worth knowing.',
                effects: { gdp: -70, gdpGrowthRate: -0.4, stability: -5, eliteSatisfaction: -10 },
                factionEffects: [
                    { factionId: 'business', support: -10, radicalization: 5 },
                    { factionId: 'military', support: 5 },
                    { factionId: 'provincial', support: 3, power: 3 },
                ],
                forecasts: [
                    {
                        advisorId: 'army_chief',
                        summary: 'The essential functions of the state keep running. That is what matters in a shortage.',
                        predictedDirection: 'mixed',
                        confidence: 'medium',
                        affectedMetric: 'militaryPower',
                    },
                    {
                        advisorId: 'finance_minister',
                        summary: 'Rationing does not reduce scarcity, it relocates the profit from it to whoever holds the pen.',
                        predictedDirection: 'down',
                        confidence: 'high',
                        affectedMetric: 'eliteSatisfaction',
                    },
                ],
                conceptIds: ['import_substitution'],
                sourceIds: ['krueger_1974_rent_seeking'],
                delayedConsequences: [
                    {
                        id: 'rationing_rents',
                        delayTurns: 1,
                        headline: 'The Licensing Office Becomes a Career',
                        narrative:
                            'The allocation system outlives the shortage that justified it. Every commodity that passes through it now supports an office, and the offices have constituencies.',
                        effects: { eliteSatisfaction: -4, gdpGrowthRate: -0.2 },
                        conceptIds: ['import_substitution'],
                    },
                ],
                setFlags: ['fuel_rationing'],
            },
        ],
        ignoreOutcome: {
            id: 'oil_shock_unanswered',
            delayTurns: 1,
            headline: 'The Republic Runs Dry',
            narrative:
                'With no decision taken, the shortage allocates itself. The grid browns out, the harvest rots at the roadside, and the government is seen to have had no answer at all.',
            effects: { stability: -18, gdpGrowthRate: -1.4, famineRisk: 10 },
            conceptIds: ['import_substitution'],
        },
    },
    {
        id: 'crisis_debt_1982',
        chapterIndex: 9,
        year: 1982,
        title: 'The Debt Crisis',
        dispatch:
            'Mexico has told its creditors it cannot pay. Within days the syndicated lending market has closed to every developing country without distinction, and the republic\'s own creditors are refusing to roll over short-term paper. Interest on what is already owed has tripled since the loans were signed. The reserves cover eleven weeks of imports.',
        theory:
            'This is what a debt overhang does. When the stock of debt is large enough that most of any additional output goes to creditors rather than to the country, the incentive to undertake the painful adjustment that would produce that output collapses — and creditors, knowing this, stop lending, which guarantees the outcome they feared.\n\nThe mechanism has three parts and the republic controls none of them. The debt was contracted at floating rates in the 1970s. The rate was raised in a foreign capital for a foreign reason. The exports that service it are priced in a market that fell at the same time.\n\nWhat is on the table is not whether to adjust but who supervises the adjustment. A fund programme brings foreign exchange and a schedule of conditions written by the creditor. A moratorium keeps sovereignty and forfeits access to capital for as long as the default is remembered — which the record suggests is roughly a decade.',
        conceptIds: ['import_substitution'],
        sourceIds: ['krugman_1988_debt_overhang', 'easterly_2005_structural_adjustment', 'stiglitz_2002_globalization'],
        tags: ['crisis', 'finance', 'history'],
        severity: state => {
            const ratio = debtRatio(state);
            if (state.flags.petrodollar_debt && ratio > 0.35) {
                return {
                    level: 'severe',
                    reading:
                        'The paper signed in 1973 is floating-rate, and it is now repricing into an economy earning a third less for its exports. This crisis was contracted nine years ago at a very good price.',
                    multiplier: 1.45,
                };
            }
            if (state.flags.petrodollar_debt || ratio > 0.3) {
                return {
                    level: 'serious',
                    reading: 'The republic is carrying enough foreign debt that the rate rise is the government\'s problem rather than the creditors\'.',
                    multiplier: 1.15,
                };
            }
            if (state.flags.absorbed_oil_shock && ratio < 0.15) {
                return {
                    level: 'contained',
                    reading:
                        'The hard year taken in 1973 is why there is no wall of floating-rate paper now. The republic is watching this crisis rather than being in it.',
                    multiplier: 0.6,
                };
            }
            return {
                level: 'serious',
                reading: 'The republic owes less than most and is being treated as though it owed the same. That is what a closed market means.',
                multiplier: 1,
            };
        },
        options: [
            {
                id: 'debt_imf_programme',
                text: 'Enter a Fund programme',
                rationale:
                    'Foreign exchange arrives quickly and the arrears are rescheduled. The conditions attached — spending cuts, devaluation, an end to subsidies — are written by the creditor and are not negotiable in substance.',
                immediateNarrative:
                    'The mission arrives, the letter of intent is signed, and the first tranche clears within a month. The conditions take effect on the same schedule: the subsidy on staple grain is withdrawn, the currency is devalued, and the hiring freeze reaches every ministry.',
                effects: {
                    stability: -16,
                    gdpGrowthRate: -0.8,
                    famineRisk: 9,
                    internationalRelations: 14,
                    eliteSatisfaction: 8,
                },
                treasuryEffect: 130,
                factionEffects: [
                    { factionId: 'labor', support: -16, radicalization: 14, grievance: 'Bread subsidy withdrawn under Fund conditions' },
                    { factionId: 'business', support: 10 },
                    { factionId: 'provincial', support: -8, radicalization: 6 },
                ],
                forecasts: [
                    {
                        advisorId: 'finance_minister',
                        summary: 'Access to foreign exchange is restored and the arrears stop compounding. The conditions are survivable.',
                        predictedDirection: 'up',
                        confidence: 'high',
                        affectedMetric: 'internationalRelations',
                        hiddenBias: 'Reports the balance-of-payments position, which improves. Does not price the subsidy withdrawal, which is not his department.',
                    },
                    {
                        advisorId: 'labor_leader',
                        summary: 'The price of bread is being set in Washington. I can tell you exactly what happens next because it has happened everywhere else.',
                        predictedDirection: 'stronglyDown',
                        confidence: 'high',
                        affectedMetric: 'stability',
                    },
                ],
                conceptIds: ['import_substitution'],
                sourceIds: ['easterly_2005_structural_adjustment', 'stiglitz_2002_globalization'],
                delayedConsequences: [
                    {
                        id: 'imf_bread_riots',
                        delayTurns: 1,
                        headline: 'The Cities Answer the Conditions',
                        narrative:
                            'Withdrawing a staple subsidy is arithmetic in a ministry and survival on a street. The riots take four days to put down and are named after the institution that required them.',
                        effects: { stability: -10, eliteSatisfaction: -6 },
                        factionEffects: [{ factionId: 'labor', radicalization: 10 }],
                        conceptIds: ['import_substitution'],
                    },
                    {
                        id: 'imf_creditworthiness',
                        delayTurns: 2,
                        headline: 'The Republic Is Lent To Again',
                        narrative:
                            'Compliance is rewarded with access. Whether the decade of adjustment bought more than access is a question the growth figures answer ambiguously.',
                        effects: { internationalRelations: 8, gdpGrowthRate: 0.3 },
                        conceptIds: ['import_substitution'],
                    },
                ],
                setFlags: ['imf_programme'],
            },
            {
                id: 'debt_moratorium',
                text: 'Declare a unilateral moratorium',
                rationale:
                    'Stop paying. The money stays in the country and the adjustment is designed here rather than abroad — at the cost of access to foreign capital for as long as this is remembered.',
                immediateNarrative:
                    'The announcement is made to the national assembly rather than to the creditors, and is received there with an ovation. By the end of the week every trade line has been withdrawn and importers are being asked to pay cash in advance for machinery parts.',
                effects: {
                    stability: 8,
                    internationalRelations: -30,
                    gdpGrowthRate: -1.2,
                    eliteSatisfaction: -14,
                },
                factionEffects: [
                    { factionId: 'labor', support: 14 },
                    { factionId: 'provincial', support: 8 },
                    { factionId: 'business', support: -18, radicalization: 10, grievance: 'Trade credit withdrawn after the default' },
                ],
                forecasts: [
                    {
                        advisorId: 'labor_leader',
                        summary: 'The debt was contracted by a government at a rate set by a foreign one. Refusing it is the only honest position available.',
                        predictedDirection: 'up',
                        confidence: 'high',
                        affectedMetric: 'stability',
                        hiddenBias: 'Correct about the politics and silent about trade finance, which is what actually stops moving.',
                    },
                    {
                        advisorId: 'finance_minister',
                        summary: 'Every importer in the country pays cash in advance from the day this is announced, and does so for years.',
                        predictedDirection: 'stronglyDown',
                        confidence: 'high',
                        affectedMetric: 'gdpGrowthRate',
                    },
                ],
                conceptIds: ['import_substitution'],
                sourceIds: ['krugman_1988_debt_overhang'],
                delayedConsequences: [
                    {
                        id: 'moratorium_isolation',
                        delayTurns: 2,
                        headline: 'A Decade Outside the Market',
                        narrative:
                            'The republic finances itself out of its own savings, which is possible and slow. Capital-intensive projects are shelved for want of anyone willing to lend against them.',
                        effects: { gdpGrowthRate: -0.4, internationalRelations: -6 },
                        conceptIds: ['import_substitution'],
                    },
                ],
                setFlags: ['debt_moratorium'],
            },
            {
                id: 'debt_own_adjustment',
                text: 'Adjust without the Fund',
                rationale:
                    'Cut and devalue on the republic\'s own schedule, keep servicing what can be serviced, and take no programme. It preserves both sovereignty and creditworthiness, and it is the hardest of the three to actually execute.',
                immediateNarrative:
                    'The budget is rewritten in six weeks. Capital projects are cancelled rather than subsidies, the currency is allowed to slide in steps, and the ministry publishes the schedule so that creditors can see it is being kept to. Nothing about it is popular and it does not require anyone\'s permission.',
                effects: {
                    stability: -9,
                    gdpGrowthRate: -0.9,
                    eliteSatisfaction: -4,
                    internationalRelations: 4,
                    educationLevel: -3,
                },
                treasuryEffect: -40,
                factionEffects: [
                    { factionId: 'labor', support: -7, radicalization: 4 },
                    { factionId: 'business', support: -3 },
                    { factionId: 'provincial', support: -9, grievance: 'Provincial capital programme cancelled to service debt' },
                ],
                forecasts: [
                    {
                        advisorId: 'finance_minister',
                        summary: 'It can be done, and it depends on an administration that can actually collect what it levies.',
                        predictedDirection: 'mixed',
                        confidence: 'medium',
                        affectedMetric: 'gdpGrowthRate',
                    },
                    {
                        advisorId: 'provincial_chair',
                        summary: 'The cuts will be made where the least noise comes from, which is the districts. It always is.',
                        predictedDirection: 'down',
                        confidence: 'high',
                        affectedMetric: 'stability',
                    },
                ],
                conceptIds: ['import_substitution'],
                sourceIds: ['easterly_2005_structural_adjustment'],
                delayedConsequences: [
                    {
                        id: 'own_adjustment_credibility',
                        delayTurns: 2,
                        headline: 'The Schedule Was Kept',
                        narrative:
                            'Having adjusted without being made to, the republic is treated as a sovereign rather than a case. The difference shows up in the price of everything it borrows afterwards.',
                        effects: { internationalRelations: 10, eliteSatisfaction: 5 },
                        conceptIds: ['import_substitution'],
                    },
                ],
                setFlags: ['sovereign_adjustment'],
            },
        ],
        ignoreOutcome: {
            id: 'debt_crisis_unanswered',
            delayTurns: 1,
            headline: 'The Reserves Are Gone',
            narrative:
                'With no decision taken, the reserves run out on their own schedule. Imports stop at the port for want of foreign exchange, and the choice is made by the absence of one.',
            effects: { stability: -20, gdpGrowthRate: -2, internationalRelations: -20, famineRisk: 12 },
            conceptIds: ['import_substitution'],
        },
    },
    {
        id: 'crisis_patron_1990',
        chapterIndex: 12,
        year: 1990,
        title: 'The Patron Withdraws',
        dispatch:
            'The Eastern bloc has stopped existing as a going concern, and with it the concessional fuel, the guaranteed purchase agreements and the military assistance that three decades of foreign policy were built around. The Western institutions that remain are willing to help, and have a model they would like adopted first.',
        theory:
            'Cold War competition had a side effect that was invisible until it stopped: developing countries could extract real resources from both blocs by being courted rather than by being productive. Non-alignment was not merely a diplomatic posture, it was a revenue strategy.\n\nWhen the competition ended, that revenue ended, and the surviving institutions no longer had a rival to be compared against. Conditionality got much harder to refuse in 1990 than it had been in 1975 — not because the conditions changed but because the alternative disappeared.\n\nThe countries that came through this best were generally those whose foreign earnings came from selling things to people who wanted them, rather than from being strategically located.',
        conceptIds: ['export_orientation'],
        sourceIds: ['world_bank_1993_east_asian_miracle', 'stiglitz_2002_globalization'],
        tags: ['crisis', 'geopolitics', 'history'],
        severity: state => {
            if (state.flags.non_aligned) {
                return {
                    level: 'severe',
                    reading:
                        'Non-alignment paid in leverage, and the leverage came from there being two sides. There is one now, and it is not bidding.',
                    multiplier: 1.35,
                };
            }
            if ((state.projectLevels.industry ?? 0) >= 2) {
                return {
                    level: 'contained',
                    reading: 'The republic earns its foreign exchange by selling manufactures to people who want them. That income does not care which bloc won.',
                    multiplier: 0.7,
                };
            }
            return {
                level: 'serious',
                reading: 'A meaningful share of the budget rested on being courted. Nobody is courting.',
                multiplier: 1,
            };
        },
        options: [
            {
                id: 'patron_adopt_model',
                text: 'Adopt the model and take the terms',
                rationale:
                    'Liberalise trade, privatise the state enterprises, open the capital account. The assistance is real and arrives quickly; so does the exposure that comes with an open capital account.',
                immediateNarrative:
                    'The reform programme is announced as a national modernisation. Tariffs come down over eighteen months, four state enterprises are sold, and foreign capital arrives looking for assets. Some of it intends to stay.',
                effects: {
                    gdpGrowthRate: 0.7,
                    internationalRelations: 16,
                    eliteSatisfaction: 10,
                    stability: -7,
                    educationLevel: -2,
                },
                treasuryEffect: 70,
                factionEffects: [
                    { factionId: 'business', support: 14 },
                    { factionId: 'labor', support: -12, radicalization: 8, grievance: 'State enterprises sold with the workforce attached' },
                    { factionId: 'provincial', support: -5 },
                ],
                forecasts: [
                    {
                        advisorId: 'finance_minister',
                        summary: 'Capital, technology and market access, all at once. The republic has been waiting thirty years for this offer.',
                        predictedDirection: 'stronglyUp',
                        confidence: 'high',
                        affectedMetric: 'gdpGrowthRate',
                        hiddenBias: 'An open capital account admits money that can leave in a week. He is describing the inflow.',
                    },
                    {
                        advisorId: 'labor_leader',
                        summary: 'Privatisation is a transfer, not a reform. The question is only who receives.',
                        predictedDirection: 'down',
                        confidence: 'medium',
                        affectedMetric: 'stability',
                    },
                ],
                conceptIds: ['export_orientation'],
                sourceIds: ['stiglitz_2002_globalization'],
                delayedConsequences: [
                    {
                        id: 'open_capital_account',
                        delayTurns: 1,
                        headline: 'The Money Arrives',
                        narrative:
                            'Portfolio investment reaches levels the exchange has never handled. Very little of it is committed to anything that cannot be sold on a Tuesday.',
                        effects: { gdp: 130, gdpGrowthRate: 0.3, eliteSatisfaction: 5 },
                        conceptIds: ['export_orientation'],
                    },
                ],
                setFlags: ['open_capital_account', 'export_oriented'],
            },
            {
                id: 'patron_selective',
                text: 'Take the assistance, keep the capital controls',
                rationale:
                    'Liberalise trade and accept the aid, but keep authority over what money may enter and leave. Less capital arrives, and what does arrive is harder to withdraw in a panic.',
                immediateNarrative:
                    'The delegation is told the republic will open its goods market and retain its exchange controls. The assistance package is smaller than it might have been and the officials are noticeably cooler. The central bank keeps its register of who holds what.',
                effects: {
                    gdpGrowthRate: 0.3,
                    internationalRelations: 6,
                    eliteSatisfaction: 2,
                    stability: -2,
                },
                treasuryEffect: 35,
                factionEffects: [
                    { factionId: 'business', support: 4 },
                    { factionId: 'labor', support: -2 },
                    { factionId: 'provincial', support: 3 },
                ],
                forecasts: [
                    {
                        advisorId: 'finance_minister',
                        summary: 'We forgo some capital for some control. Whether that is a good trade depends on a crisis that has not happened.',
                        predictedDirection: 'mixed',
                        confidence: 'medium',
                        affectedMetric: 'gdpGrowthRate',
                    },
                    {
                        advisorId: 'army_chief',
                        summary: 'A state that cannot say who may take money out of it is not sovereign in any sense I recognise.',
                        predictedDirection: 'up',
                        confidence: 'low',
                        affectedMetric: 'stability',
                    },
                ],
                conceptIds: ['export_orientation'],
                sourceIds: ['world_bank_1993_east_asian_miracle'],
                delayedConsequences: [
                    {
                        id: 'controls_hold',
                        delayTurns: 2,
                        headline: 'The Controls Are Tested',
                        narrative:
                            'When money leaves the region in a hurry, it leaves the republic more slowly than it leaves its neighbours. The difference is measured in whether the banks open.',
                        effects: { stability: 6, internationalRelations: -3 },
                        conceptIds: ['export_orientation'],
                    },
                ],
                setFlags: ['capital_controls'],
            },
            {
                id: 'patron_refuse',
                text: 'Refuse the terms and finance the state domestically',
                rationale:
                    'No programme, no privatisation, no aid. The budget is closed by taxing and borrowing at home, which requires an administration capable of doing both.',
                immediateNarrative:
                    'The refusal is delivered publicly and is popular for about a year. Domestic borrowing costs rise steadily as the government becomes the largest buyer in a small market, and the revenue service is asked to do something it has never yet managed.',
                effects: {
                    internationalRelations: -14,
                    gdpGrowthRate: -0.5,
                    stability: 5,
                    eliteSatisfaction: -8,
                },
                factionEffects: [
                    { factionId: 'labor', support: 10 },
                    { factionId: 'provincial', support: 6 },
                    { factionId: 'business', support: -12, radicalization: 6 },
                ],
                forecasts: [
                    {
                        advisorId: 'provincial_chair',
                        summary: 'The districts would rather be poor on their own terms than managed from abroad. They have said so.',
                        predictedDirection: 'up',
                        confidence: 'medium',
                        affectedMetric: 'stability',
                    },
                    {
                        advisorId: 'finance_minister',
                        summary: 'Financing this at home means collecting tax we have never collected. I would not plan on it.',
                        predictedDirection: 'stronglyDown',
                        confidence: 'high',
                        affectedMetric: 'gdpGrowthRate',
                    },
                ],
                conceptIds: ['import_substitution'],
                sourceIds: ['bruton_1998_import_substitution'],
                delayedConsequences: [
                    {
                        id: 'domestic_finance_strain',
                        delayTurns: 1,
                        headline: 'The State Borrows From Itself',
                        narrative:
                            'Domestic debt service now consumes a share of revenue that would have been unthinkable when the decision was taken. The independence is real and it is being paid for annually.',
                        effects: { gdpGrowthRate: -0.3, eliteSatisfaction: -5 },
                        conceptIds: ['import_substitution'],
                    },
                ],
                setFlags: ['refused_consensus'],
            },
        ],
        ignoreOutcome: {
            id: 'patron_unanswered',
            delayTurns: 1,
            headline: 'The Subsidy Simply Stops',
            narrative:
                'No position is taken and the concessional fuel stops arriving anyway. The budget discovers the hole in the middle of a fiscal year.',
            effects: { stability: -12, gdpGrowthRate: -1, internationalRelations: -10 },
            conceptIds: ['export_orientation'],
        },
    },
    {
        id: 'crisis_contagion_1998',
        chapterIndex: 15,
        year: 1998,
        title: 'Contagion',
        dispatch:
            'A currency has broken on the other side of the world. Within six weeks the funds that hold the republic\'s paper have stopped distinguishing between one developing economy and another, and are selling all of them to meet redemptions at home. The exchange rate is under attack by people who have never been here.',
        theory:
            'A sudden stop is not a judgment on the country experiencing it. Capital that arrives as portfolio investment can reverse in days, and when it reverses it does so across an asset class rather than across a set of fundamentals — the fund manager selling your bonds is meeting a redemption, not forming a view about your land reform.\n\nThe defence available depends almost entirely on decisions taken years earlier. A country with capital controls has a door it can close. A country with large reserves can buy time. A country that financed a current-account deficit with short-term foreign-currency borrowing has neither, and will spend the crisis choosing between defending the currency and keeping its banks open.\n\nThe orthodox response — raise rates sharply to hold the currency — protects the exchange rate by putting the domestic economy into recession. Whether that trade is worth making has been argued about ever since.',
        conceptIds: ['export_orientation'],
        sourceIds: ['calvo_1998_sudden_stops', 'stiglitz_2002_globalization'],
        tags: ['crisis', 'finance', 'history'],
        severity: state => {
            if (state.flags.open_capital_account && !state.flags.capital_controls) {
                return {
                    level: 'severe',
                    reading:
                        'The capital account was opened in 1990 and the money that came in through it is going out the same way. There is no door to close.',
                    multiplier: 1.4,
                };
            }
            if (state.flags.capital_controls) {
                return {
                    level: 'contained',
                    reading: 'The controls kept in 1990 are the reason this is a bad month rather than a bank holiday.',
                    multiplier: 0.55,
                };
            }
            return {
                level: 'serious',
                reading: 'The republic is being sold along with its neighbours, on their fundamentals rather than its own.',
                multiplier: 1,
            };
        },
        options: [
            {
                id: 'contagion_defend',
                text: 'Raise rates and defend the currency',
                rationale:
                    'The orthodox defence. It can hold the exchange rate and it does so by making credit unaffordable for every domestic business at the same time.',
                immediateNarrative:
                    'Overnight rates go to levels that make working capital impossible to roll over. The currency holds. Within two quarters the corporate bankruptcies begin, and they are not confined to the firms that borrowed recklessly.',
                effects: { gdpGrowthRate: -1.6, stability: -8, eliteSatisfaction: -10, internationalRelations: 8 },
                factionEffects: [
                    { factionId: 'business', support: -14, radicalization: 7, grievance: 'Credit withdrawn overnight to defend a rate' },
                    { factionId: 'labor', support: -8 },
                ],
                forecasts: [
                    {
                        advisorId: 'finance_minister',
                        summary: 'Hold the rate and the panic passes. Devalue and it accelerates.',
                        predictedDirection: 'up',
                        confidence: 'high',
                        affectedMetric: 'internationalRelations',
                        hiddenBias: 'The rate is his mandate. The bankruptcies are somebody else\'s indicator.',
                    },
                    {
                        advisorId: 'labor_leader',
                        summary: 'Firms that employ people are going to close so that a number stays where it is.',
                        predictedDirection: 'stronglyDown',
                        confidence: 'high',
                        affectedMetric: 'gdpGrowthRate',
                    },
                ],
                conceptIds: ['export_orientation'],
                sourceIds: ['calvo_1998_sudden_stops'],
                delayedConsequences: [
                    {
                        id: 'defence_recession',
                        delayTurns: 1,
                        headline: 'The Currency Held',
                        narrative:
                            'The exchange rate is where it was. So is a great deal of the productive capacity, in receivership.',
                        effects: { gdpGrowthRate: -0.4, eliteSatisfaction: -4 },
                        conceptIds: ['export_orientation'],
                    },
                ],
                setFlags: ['defended_currency'],
            },
            {
                id: 'contagion_float',
                text: 'Let the currency go',
                rationale:
                    'Stop defending and let it find a level. Anyone holding foreign-currency debt is ruined by the move; anyone selling abroad is handed a competitive advantage.',
                immediateNarrative:
                    'The peg is abandoned on a Friday and the currency loses a third of its value by the following Wednesday. Importers and dollar-borrowers are destroyed. The export sector, for the first time in its existence, cannot fill its orders fast enough.',
                effects: { gdpGrowthRate: -0.7, stability: -10, externalDebt: 90, eliteSatisfaction: -6 },
                factionEffects: [
                    { factionId: 'business', support: -6 },
                    { factionId: 'labor', support: -6, radicalization: 5 },
                    { factionId: 'provincial', support: 4 },
                ],
                forecasts: [
                    {
                        advisorId: 'provincial_chair',
                        summary: 'The districts sell abroad. A cheaper currency is the first good news they have had in a decade.',
                        predictedDirection: 'up',
                        confidence: 'medium',
                        affectedMetric: 'gdpGrowthRate',
                    },
                    {
                        advisorId: 'finance_minister',
                        summary: 'Every obligation we hold in foreign currency becomes a third larger on the day we do this.',
                        predictedDirection: 'stronglyDown',
                        confidence: 'high',
                        affectedMetric: 'externalDebt',
                    },
                ],
                conceptIds: ['export_orientation'],
                sourceIds: ['calvo_1998_sudden_stops'],
                delayedConsequences: [
                    {
                        id: 'devaluation_export_boom',
                        delayTurns: 1,
                        headline: 'The Exporters Have Their Decade',
                        narrative:
                            'A competitive exchange rate does what tariffs and subsidies had been asked to do for thirty years. The firms that survived the transition are the ones that were already selling abroad.',
                        effects: { gdpGrowthRate: 0.9, gdp: 110 },
                        conceptIds: ['export_orientation'],
                    },
                ],
                setFlags: ['devalued', 'export_oriented'],
            },
            {
                id: 'contagion_controls',
                text: 'Impose emergency capital controls',
                rationale:
                    'Close the exit. It stops the outflow immediately and tells every future investor that this is a government that will change the rules when the rules become inconvenient.',
                immediateNarrative:
                    'Transfers abroad are suspended by decree over a weekend. The outflow stops that day. The republic spends the following years explaining the decision to every counterparty it wishes to deal with.',
                effects: { stability: 6, gdpGrowthRate: -0.5, internationalRelations: -18, eliteSatisfaction: -8 },
                factionEffects: [
                    { factionId: 'labor', support: 8 },
                    { factionId: 'business', support: -10, radicalization: 6 },
                    { factionId: 'military', support: 4 },
                ],
                forecasts: [
                    {
                        advisorId: 'army_chief',
                        summary: 'A state that can be emptied by telephone is not a state. Close it.',
                        predictedDirection: 'up',
                        confidence: 'high',
                        affectedMetric: 'stability',
                    },
                    {
                        advisorId: 'finance_minister',
                        summary: 'It works, once. The cost is paid over the following decade in the price of everything we borrow.',
                        predictedDirection: 'mixed',
                        confidence: 'medium',
                        affectedMetric: 'internationalRelations',
                    },
                ],
                conceptIds: ['export_orientation'],
                sourceIds: ['stiglitz_2002_globalization'],
                delayedConsequences: [
                    {
                        id: 'emergency_controls_memory',
                        delayTurns: 2,
                        headline: 'The Markets Remember',
                        narrative:
                            'The controls came off years ago. The premium charged to the republic for having once imposed them has not.',
                        effects: { internationalRelations: -5, gdpGrowthRate: -0.2 },
                        conceptIds: ['export_orientation'],
                    },
                ],
                setFlags: ['emergency_controls', 'capital_controls'],
            },
        ],
        ignoreOutcome: {
            id: 'contagion_unanswered',
            delayTurns: 1,
            headline: 'The Reserves Are Spent Defending Nothing',
            narrative:
                'Without a decision the central bank defends the rate until it cannot, and then stops. The republic gets the devaluation anyway, having paid for the delay in reserves.',
            effects: { gdpGrowthRate: -1.8, stability: -14, externalDebt: 110, internationalRelations: -12 },
            conceptIds: ['export_orientation'],
        },
    },
    {
        id: 'crisis_recession_2008',
        chapterIndex: 18,
        year: 2008,
        title: 'The Great Recession',
        dispatch:
            'The financial system of the countries that write the rules has seized. Trade finance — the ordinary credit that lets a shipment leave a port before it is paid for — has become unobtainable at any price. Export orders are being cancelled rather than renegotiated, and the commodity price that funded the last seven budgets has fallen by half in a quarter.',
        theory:
            'The 2008 crisis reached developing countries through three channels, none of which involved anything they had done: trade finance dried up, export demand collapsed, and commodity prices fell as the industrial economies stopped buying.\n\nThe countries that had run surpluses during the boom had something to spend and spent it. The countries that had treated boom-era revenue as permanent — and written it into salaries, subsidies and recurrent commitments — discovered that a commodity windfall is an asset only if some of it was saved, and a liability if all of it was budgeted.\n\nThis is the resource curse arriving on schedule. It is not that resources are bad. It is that revenue which fluctuates violently gets spent on commitments which do not.',
        conceptIds: ['resource_curse', 'sovereign_wealth_fund'],
        sourceIds: ['frankel_2010_natural_resource_curse', 'truman_2008_sovereign_wealth_funds'],
        tags: ['crisis', 'finance', 'history'],
        severity: state => {
            const minerals = mineralWeight(state);
            if (state.flags.sovereign_fund_established) {
                return {
                    level: 'contained',
                    reading: 'The fund established during the boom is exactly the instrument this moment was described as needing. It is being drawn on now.',
                    multiplier: 0.5,
                };
            }
            if (minerals > 0.25 && state.treasury < 120) {
                return {
                    level: 'severe',
                    reading:
                        'Seven years of commodity revenue went into recurrent spending. The price has halved and the commitments have not, and there is nothing set aside.',
                    multiplier: 1.4,
                };
            }
            return {
                level: 'serious',
                reading: 'Export orders are being cancelled and the credit that moves goods has stopped. Neither is anything the republic did.',
                multiplier: 1,
            };
        },
        options: [
            {
                id: 'recession_stimulus',
                text: 'Borrow and spend into the downturn',
                rationale:
                    'Counter-cyclical spending holds employment and demand through the trough. It works if the borrowing is affordable and the projects are real, and it is a debt problem in four years if either fails.',
                immediateNarrative:
                    'A public works programme is announced within the month: roads, housing, grid extension. Employment holds through the worst of the contraction. The borrowing is at rates that look reasonable in 2008.',
                effects: { stability: 8, gdpGrowthRate: 0.5, externalDebt: 200, eliteSatisfaction: 4 },
                treasuryEffect: 60,
                factionEffects: [
                    { factionId: 'labor', support: 12 },
                    { factionId: 'provincial', support: 8 },
                    { factionId: 'business', support: 4 },
                ],
                forecasts: [
                    {
                        advisorId: 'labor_leader',
                        summary: 'Keeping people in work through a downturn nobody here caused is the entire purpose of having a state.',
                        predictedDirection: 'stronglyUp',
                        confidence: 'high',
                        affectedMetric: 'stability',
                    },
                    {
                        advisorId: 'finance_minister',
                        summary: 'Affordable at today\'s rates. I would want to know what we think rates do in fifteen years.',
                        predictedDirection: 'mixed',
                        confidence: 'medium',
                        affectedMetric: 'externalDebt',
                    },
                ],
                conceptIds: ['resource_curse'],
                sourceIds: ['frankel_2010_natural_resource_curse'],
                delayedConsequences: [
                    {
                        id: 'stimulus_debt_tail',
                        delayTurns: 3,
                        headline: 'The Stimulus Debt Refinances',
                        narrative:
                            'The borrowing that carried the republic through 2009 comes up for renewal in a decade with a very different price of money.',
                        effects: { externalDebt: 90, gdpGrowthRate: -0.3 },
                        conceptIds: ['resource_curse'],
                    },
                ],
                setFlags: ['crisis_stimulus'],
            },
            {
                id: 'recession_protect_fund',
                text: 'Cut recurrent spending and protect the balance sheet',
                rationale:
                    'Take the contraction. Salaries and subsidies are held or trimmed, capital projects are deferred, and the republic comes out of the trough owing what it owed going in.',
                immediateNarrative:
                    'The public payroll is frozen and three capital projects are shelved. Unemployment rises through the trough and the government is blamed for a contraction it did not cause and chose not to cushion.',
                effects: { stability: -12, gdpGrowthRate: -0.9, eliteSatisfaction: 6, educationLevel: -2 },
                factionEffects: [
                    { factionId: 'labor', support: -14, radicalization: 9, grievance: 'Wages frozen through a crisis made elsewhere' },
                    { factionId: 'business', support: 8 },
                    { factionId: 'provincial', support: -7 },
                ],
                forecasts: [
                    {
                        advisorId: 'finance_minister',
                        summary: 'We did not cause this and we will not borrow through it. The balance sheet is what survives the cycle.',
                        predictedDirection: 'down',
                        confidence: 'high',
                        affectedMetric: 'gdpGrowthRate',
                    },
                    {
                        advisorId: 'provincial_chair',
                        summary: 'The deferred projects are all outside the capital. They are always outside the capital.',
                        predictedDirection: 'down',
                        confidence: 'high',
                        affectedMetric: 'stability',
                    },
                ],
                conceptIds: ['sovereign_wealth_fund'],
                sourceIds: ['truman_2008_sovereign_wealth_funds'],
                delayedConsequences: [
                    {
                        id: 'balance_sheet_intact',
                        delayTurns: 2,
                        headline: 'Solvent Into the Next Decade',
                        narrative:
                            'The republic enters the 2010s without a stimulus overhang, and can borrow when it chooses to rather than when it must.',
                        effects: { internationalRelations: 8, gdpGrowthRate: 0.3 },
                        conceptIds: ['sovereign_wealth_fund'],
                    },
                ],
                setFlags: ['austerity_2008'],
            },
            {
                id: 'recession_diversify',
                text: 'Use the crisis to move out of commodities',
                rationale:
                    'Direct what can be spent into the sectors the downturn has exposed as missing. It costs growth now and is the only one of the three options that changes what the next crisis does.',
                immediateNarrative:
                    'Rather than replacing lost commodity revenue, the budget is redirected: technical training, industrial credit, port and grid capacity for manufactures. The commodity provinces are told, in public, that the boom is not coming back on the old terms.',
                effects: {
                    gdpGrowthRate: -0.4,
                    educationLevel: 7,
                    stability: -6,
                    eliteSatisfaction: -6,
                },
                treasuryEffect: -70,
                factionEffects: [
                    { factionId: 'business', support: 6 },
                    { factionId: 'labor', support: 4 },
                    { factionId: 'provincial', support: -12, radicalization: 7, grievance: 'Mining districts told the boom would not return' },
                ],
                forecasts: [
                    {
                        advisorId: 'finance_minister',
                        summary: 'The downturn has shown us precisely which part of the economy was an accident of price. Building the other part is expensive and it is the only thing that compounds.',
                        predictedDirection: 'up',
                        confidence: 'medium',
                        affectedMetric: 'educationLevel',
                    },
                    {
                        advisorId: 'provincial_chair',
                        summary: 'You are telling the districts that dug the country out of the eighties that they are the past. Expect them to hear it that way.',
                        predictedDirection: 'stronglyDown',
                        confidence: 'high',
                        affectedMetric: 'stability',
                    },
                ],
                conceptIds: ['resource_curse', 'export_orientation'],
                sourceIds: ['auty_1993_resource_curse', 'sachs_warner_1995_natural_resource'],
                delayedConsequences: [
                    {
                        id: 'diversification_pays',
                        delayTurns: 3,
                        headline: 'The Other Economy Arrives',
                        narrative:
                            'The training and credit put in place during the downturn produce an industrial base that does not move with the ore price. It took twelve years and outlasted the government that started it.',
                        effects: { gdpGrowthRate: 0.8, gdp: 190, educationLevel: 4 },
                        conceptIds: ['export_orientation'],
                    },
                ],
                setFlags: ['diversified', 'export_oriented'],
            },
        ],
        ignoreOutcome: {
            id: 'recession_unanswered',
            delayTurns: 1,
            headline: 'The Orders Are Simply Cancelled',
            narrative:
                'No response is formulated. Export orders lapse, trade credit stays frozen, and the contraction runs its course without anything standing in its way.',
            effects: { gdpGrowthRate: -2, stability: -14, eliteSatisfaction: -10 },
            conceptIds: ['resource_curse'],
        },
    },
    {
        id: 'crisis_pandemic_2020',
        chapterIndex: 22,
        year: 2020,
        title: 'The Closed World',
        dispatch:
            'Borders have closed, ports are operating at a fraction of capacity, and the republic is discovering in real time how much of its state can actually reach the people in it. What is being tested is not the health budget. It is whether the government can identify, contact and deliver to its own population — a capability accumulated over sixty years or not at all.',
        theory:
            'A pandemic is a test of state capacity in the most literal sense: the ability to know who lives where, to reach them, and to be believed when you do. None of those can be procured during the emergency. They are the accumulated residue of decades of ordinary administration — census, registry, schooling, clinics, and a record of not lying to people.\n\nThe economic dimension is the same test wearing different clothes. A state that can identify households can support them through a shutdown. A state that cannot must choose between a shutdown that starves people and an opening that kills them, and will be blamed for whichever it picks.\n\nThis is why institutional capacity is treated in the development literature as a stock rather than a policy. It cannot be bought at the moment of need, and it is invisible until precisely that moment.',
        conceptIds: ['labor_standards'],
        sourceIds: ['ilo_1998_fundamental_principles', 'world_bank_1993_east_asian_miracle'],
        tags: ['crisis', 'health', 'history'],
        severity: state => {
            const capacity = state.country.educationLevel + (state.projectLevels.universities ?? 0) * 8;
            if (capacity > 68) {
                return {
                    level: 'contained',
                    reading: 'Sixty years of schooling and registry work mean the state knows who its people are and can reach them. That is the entire difference here.',
                    multiplier: 0.6,
                };
            }
            if (capacity < 38) {
                return {
                    level: 'severe',
                    reading:
                        'The republic cannot identify or reach most of its own population. Any measure announced from the capital will be an announcement rather than a policy.',
                    multiplier: 1.4,
                };
            }
            return {
                level: 'serious',
                reading: 'The state can reach the towns and not the districts, which means the districts will bear this.',
                multiplier: 1,
            };
        },
        options: [
            {
                id: 'pandemic_support',
                text: 'Close, and pay households to stay closed',
                rationale:
                    'A shutdown with income support behind it. It works to the exact extent that the state can find the households it intends to pay.',
                immediateNarrative:
                    'The transfer programme reaches the registered urban population within weeks and the unregistered rural population unevenly, or not at all. Where it lands it holds the line. Where it does not, the shutdown is simply hunger with a legal basis.',
                effects: { stability: 4, gdpGrowthRate: -1.4, famineRisk: 5, educationLevel: -3 },
                treasuryEffect: -120,
                factionEffects: [
                    { factionId: 'labor', support: 12 },
                    { factionId: 'provincial', support: -6, grievance: 'Transfers reached the capital and not the districts' },
                    { factionId: 'business', support: -10 },
                ],
                forecasts: [
                    {
                        advisorId: 'labor_leader',
                        summary: 'Support the households and the closure holds. Do not, and it collapses in a fortnight regardless of what is decreed.',
                        predictedDirection: 'up',
                        confidence: 'high',
                        affectedMetric: 'stability',
                    },
                    {
                        advisorId: 'provincial_chair',
                        summary: 'You will pay the people you have records for. I can tell you which districts have no records.',
                        predictedDirection: 'mixed',
                        confidence: 'high',
                        affectedMetric: 'famineRisk',
                    },
                ],
                conceptIds: ['labor_standards'],
                sourceIds: ['ilo_1998_fundamental_principles'],
                delayedConsequences: [
                    {
                        id: 'registry_built_under_fire',
                        delayTurns: 1,
                        headline: 'The Registry Built in an Emergency',
                        narrative:
                            'Enrolling millions of households for transfers has, incidentally, produced the population register the republic never got around to building. It will be used for everything from now on.',
                        effects: { educationLevel: 4, stability: 4 },
                        conceptIds: ['labor_standards'],
                    },
                ],
                setFlags: ['household_registry'],
            },
            {
                id: 'pandemic_stay_open',
                text: 'Keep the economy open',
                rationale:
                    'The republic cannot afford a shutdown it cannot fund. Staying open protects output and livelihoods and accepts a human cost that will be counted publicly.',
                immediateNarrative:
                    'Ports and factories keep running. The output figures for the year are the best in the region and are cited as such. The mortality figures are the worst, and are cited as such by everyone else.',
                effects: { gdpGrowthRate: -0.3, stability: -12, population: -0.12, eliteSatisfaction: 8, internationalRelations: -8 },
                factionEffects: [
                    { factionId: 'business', support: 14 },
                    { factionId: 'labor', support: -18, radicalization: 12, grievance: 'Kept at work through the pandemic' },
                    { factionId: 'provincial', support: -8 },
                ],
                forecasts: [
                    {
                        advisorId: 'finance_minister',
                        summary: 'A shutdown we cannot finance is a famine with better paperwork. Stay open.',
                        predictedDirection: 'up',
                        confidence: 'high',
                        affectedMetric: 'gdpGrowthRate',
                        hiddenBias: 'Measures output. The cost of this choice is not recorded in any indicator he reports on.',
                    },
                    {
                        advisorId: 'labor_leader',
                        summary: 'The people being kept at work are not the people making this decision. They will remember which side you were on.',
                        predictedDirection: 'stronglyDown',
                        confidence: 'high',
                        affectedMetric: 'stability',
                    },
                ],
                conceptIds: ['labor_standards'],
                sourceIds: ['ilo_1998_fundamental_principles', 'oecd_2000_core_labour_standards'],
                delayedConsequences: [
                    {
                        id: 'pandemic_political_memory',
                        delayTurns: 1,
                        headline: 'The Count Is Published',
                        narrative:
                            'The excess mortality figures are compiled by people the government does not control, and are read alongside the output figures the government publicised.',
                        effects: { stability: -6, internationalRelations: -5 },
                        factionEffects: [{ factionId: 'labor', radicalization: 8 }],
                        conceptIds: ['labor_standards'],
                    },
                ],
                setFlags: ['stayed_open'],
            },
            {
                id: 'pandemic_build_capacity',
                text: 'Close, and build the delivery system while closed',
                rationale:
                    'Use the emergency to construct what the emergency has exposed: registries, clinics, a rural health cadre. The most expensive option now and the only one that is still there afterwards.',
                immediateNarrative:
                    'Alongside the closure, twelve thousand community health workers are recruited, trained and attached to district clinics, and a household register is built from scratch. It is chaotic, it is late, and by the second wave it works.',
                effects: { gdpGrowthRate: -1.6, educationLevel: 8, stability: -3, famineRisk: -4 },
                treasuryEffect: -160,
                factionEffects: [
                    { factionId: 'labor', support: 8 },
                    { factionId: 'provincial', support: 12 },
                    { factionId: 'business', support: -12, radicalization: 6 },
                ],
                forecasts: [
                    {
                        advisorId: 'provincial_chair',
                        summary: 'Every district has been asking for a clinic and a register for sixty years. It should not have taken this.',
                        predictedDirection: 'stronglyUp',
                        confidence: 'high',
                        affectedMetric: 'educationLevel',
                    },
                    {
                        advisorId: 'finance_minister',
                        summary: 'We are financing permanent capacity out of a collapsed revenue year. The arithmetic is genuinely bad.',
                        predictedDirection: 'down',
                        confidence: 'high',
                        affectedMetric: 'gdpGrowthRate',
                    },
                ],
                conceptIds: ['labor_standards'],
                sourceIds: ['world_bank_1993_east_asian_miracle'],
                delayedConsequences: [
                    {
                        id: 'capacity_compounds',
                        delayTurns: 2,
                        headline: 'The Cadre Stays',
                        narrative:
                            'The health workers recruited in the emergency are still in post, and are now the mechanism by which every rural programme reaches anybody. The state can find its own population for the first time.',
                        effects: { educationLevel: 6, famineRisk: -8, stability: 6 },
                        conceptIds: ['labor_standards'],
                    },
                ],
                setFlags: ['household_registry', 'rural_health_cadre'],
            },
        ],
        ignoreOutcome: {
            id: 'pandemic_unanswered',
            delayTurns: 1,
            headline: 'The Capital Improvises and the Districts Do Not',
            narrative:
                'No national response is issued. Provinces close their own borders against each other, the grain trade breaks down between them, and the state is absent from the worst months of the century.',
            effects: { stability: -18, gdpGrowthRate: -2.2, famineRisk: 14, population: -0.15 },
            conceptIds: ['labor_standards'],
        },
    },
];

const CRISES_BY_CHAPTER = new Map(WORLD_CRISES.map(crisis => [crisis.chapterIndex, crisis]));

/** The crisis preempting a given session, if the world has intervened in it. */
export const crisisForChapter = (chapterIndex: number): WorldCrisis | null =>
    CRISES_BY_CHAPTER.get(chapterIndex) ?? null;

export const crisisById = (id: string): WorldCrisis | null =>
    WORLD_CRISES.find(crisis => crisis.id === id) ?? null;
