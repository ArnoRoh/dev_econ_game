import type { PolicyProposal } from '../../engine/types.ts';

const INSULATED_BUREAU_SOURCES = [
    'johnson_1982_miti',
    'evans_1995_embedded_autonomy',
    'wade_1990_governing_the_market',
];

const POLITICAL_MINISTRY_SOURCES = [
    'evans_1995_embedded_autonomy',
    'krueger_1974_rent_seeking',
];

const NO_AGENCY_SOURCES = [
    'krugman_1994_myth_asias_miracle',
];

const PILOT_AGENCY_SOURCES = [
    ...INSULATED_BUREAU_SOURCES,
    ...POLITICAL_MINISTRY_SOURCES,
    ...NO_AGENCY_SOURCES,
];

const LIN_CHANG_SOURCES = [
    'lin_chang_2009_industrial_policy_debate',
    'chang_2002_kicking_away_the_ladder',
];

const DEFY_SOURCES = [
    ...LIN_CHANG_SOURCES,
    'baldwin_1969_infant_industry',
];

const MARKET_DECIDES_SOURCES = [
    'krugman_1994_myth_asias_miracle',
];

const COMPARATIVE_ADVANTAGE_SOURCES = [
    ...LIN_CHANG_SOURCES,
    'baldwin_1969_infant_industry',
    'krugman_1994_myth_asias_miracle',
];

const DISCIPLINE_SOURCES = [
    'amsden_1989_asias_next_giant',
    'wade_1990_governing_the_market',
];

const SOFTEN_SOURCES = [
    'amsden_1989_asias_next_giant',
    'krueger_1974_rent_seeking',
];

const LOAN_CONVERSION_SOURCES = [
    'amsden_1989_asias_next_giant',
    'wade_1990_governing_the_market',
];

const DISCIPLINE_TEST_SOURCES = [
    ...DISCIPLINE_SOURCES,
    ...SOFTEN_SOURCES,
];

const SELECTION_SOURCES = [
    'pack_saggi_2006_industrial_policy_primer',
    'noland_pack_2003_industrial_policy_asia',
];

const SELF_DISCOVERY_SOURCES = [
    'hausmann_rodrik_2003_self_discovery',
];

const MIRACLE_ACCOUNTING_SOURCES = [
    'krugman_1994_myth_asias_miracle',
    'young_1995_tyranny_of_numbers',
    'world_bank_1993_east_asian_miracle',
];

const SELECTION_PROBLEM_SOURCES = [
    ...SELECTION_SOURCES,
    ...SELF_DISCOVERY_SOURCES,
    ...MIRACLE_ACCOUNTING_SOURCES,
];

const PREMATURE_DEINDUSTRIALIZATION_SOURCES = [
    'rodrik_2016_premature_deindustrialization',
];

const GLOBAL_VALUE_CHAIN_SOURCES = [
    'harrison_rodriguez_clare_2010_trade_industrial_policy',
];

const DEINDUSTRIALIZATION_STEP_SOURCES = [
    ...PREMATURE_DEINDUSTRIALIZATION_SOURCES,
    ...GLOBAL_VALUE_CHAIN_SOURCES,
    ...SELF_DISCOVERY_SOURCES,
];

/**
 * The developmental-state arc: whether a deliberately built industrial
 * bureaucracy can pick sectors, hold firms to their end of a bargain, and
 * still recognize when picking sectors has stopped working. Each step stages
 * a live scholarly dispute rather than a settled lesson — Lin against Chang at
 * step two, Amsden's reciprocity thesis against its enforcement cost at step
 * three, the selection-bias critique of industrial policy's own evidence base
 * at step four, and Rodrik's premature deindustrialization at step five. The
 * flags a step sets are read by the ones that follow, so the same choice about
 * which sector to back at step two determines who is asked to fail at step
 * three.
 */
export const DEVELOPMENTAL_STATE_ARC = [
    {
        id: 'dev_state_pilot_agency',
        arcId: 'developmental_state',
        arcStep: 1,
        title: 'Building the Pilot Agency',
        sponsorId: 'finance_minister',
        brief: 'The finance minister proposes a dedicated body to plan and coordinate industrial development, staffed by competitive examination rather than patronage. The question is how close such a body should sit to the businesses it studies, and how far from the politics that would like to direct it.',
        stakeholderSummary: 'The treasury wants a body that can act faster and more consistently than annual cabinet politics allows; established firms want a serious partner, not a rival regulator; the cabinet wants to know who this agency answers to when its judgment and the government’s short-term interest diverge.',
        conceptIds: ['developmental_state', 'state_capacity'],
        sourceIds: PILOT_AGENCY_SOURCES,
        backgroundTheory:
            'Chalmers Johnson\'s study of Japan\'s Ministry of International Trade and Industry gave the "developmental state" its name and its central claim: that the East Asian late industrialisers were not markets that governments left alone, nor commands that governments issued, but something third — a small, elite, insulated bureaucracy with the authority to allocate credit and foreign exchange, and the standing to make private firms take its judgment seriously.\n\nPeter Evans named the condition under which this works and the reason it is so hard to copy. An agency must have *embedded autonomy*: embedded enough in industry to know which firms are lying about their costs and which technologies are actually within reach, and autonomous enough that knowing those things does not turn into serving them. Neither half is sufficient. An agency with no industrial contacts allocates blindly. An agency with nothing but industrial contacts becomes the industry\'s lobbyist inside the state, and the subsidies it defends become permanent.\n\nThe strongest objection is not that this is wrong but that it may be useless as advice. If effective industrial policy requires a bureaucracy with the recruitment standards, prestige and internal discipline of MITI or the Korean Economic Planning Board, then the states capable of following the recommendation are the ones that least need it, and the states that need it most cannot execute it. Recommending embedded autonomy to a government that lacks it is close to recommending that it already be a different country. Nothing decided in this session escapes that problem; the most an opening move can do is decide whether the attempt is made at all, and who the resulting body will actually answer to when its advice becomes politically inconvenient.',
        minYear: 1964,
        options: [
            {
                id: 'charter_insulated_planning_bureau',
                text: 'Charter an insulated planning bureau',
                rationale: 'A bureau staffed by examination and shielded from routine political appointment can build the technical depth to negotiate with business as something like an equal, but insulation cuts both ways: an agency close enough to industry to know what it needs is also close enough to be captured by it.',
                immediateNarrative: 'A new planning bureau is chartered with fixed terms for its senior staff, recruited by national examination rather than ministerial appointment. Its first task is simply learning the country’s industries well enough to have an opinion worth having.',
                effects: { gdpGrowthRate: 0.1, eliteSatisfaction: -2, stability: 1 },
                treasuryEffect: -14,
                factionEffects: [
                    { factionId: 'business', support: 3 },
                    { factionId: 'provincial', support: -3 },
                    { factionId: 'labor', support: 1 },
                ],
                forecasts: [
                    {
                        advisorId: 'finance_minister',
                        summary: 'An examination-staffed bureau should be able to hold its judgments against pressure from any single firm, provided its charter actually survives the first minister who wants a favor done.',
                        predictedDirection: 'up',
                        confidence: 'medium',
                        affectedMetric: 'gdpGrowthRate',
                    },
                    {
                        advisorId: 'provincial_chair',
                        summary: 'A bureau based in the capital and recruited by national examination is likely to know the capital’s industries first, and everyone else’s second.',
                        predictedDirection: 'mixed',
                        confidence: 'medium',
                        affectedMetric: 'stability',
                    },
                ],
                conceptIds: ['developmental_state', 'state_capacity'],
                sourceIds: INSULATED_BUREAU_SOURCES,
                delayedConsequences: [
                    {
                        id: 'insulated_bureau_first_hires',
                        delayTurns: 2,
                        headline: 'The Examination Produces a First Generation of Planners',
                        narrative: 'The bureau’s first cohort arrives with strong technical training and no political patrons to answer to. Whether that becomes useful judgment or a closed, self-referential culture depends on whether the bureau is ever asked to defend a decision in public.',
                        effects: { gdpGrowthRate: 0.15, eliteSatisfaction: -1 },
                        requiredFlags: ['planning_bureau_insulated'],
                        conceptIds: ['state_capacity'],
                    },
                ],
                setFlags: ['dev_agency_established', 'planning_bureau_insulated'],
            },
            {
                id: 'create_cabinet_ministry',
                text: 'Create a ministry answerable to the cabinet',
                rationale: 'A ministry inside the ordinary chain of command is easier to hold accountable through normal politics, but the same accountability means every appointment and every sector chosen can be read as a political favor rather than a technical judgment.',
                immediateNarrative: 'A new industrial development ministry is created under a cabinet appointee. Its organization chart looks like every other ministry, which reassures legislators and worries the businesspeople who were hoping for something more independent of this year’s cabinet.',
                effects: { eliteSatisfaction: 2, gdpGrowthRate: 0.05, stability: 1 },
                treasuryEffect: -10,
                factionEffects: [
                    { factionId: 'business', support: -1 },
                    { factionId: 'provincial', support: 3 },
                    { factionId: 'military', support: 1 },
                ],
                forecasts: [
                    {
                        advisorId: 'finance_minister',
                        summary: 'A ministry the cabinet can direct should move faster on the government’s actual priorities, though those priorities will now include whichever firm has the best access to this year’s minister.',
                        predictedDirection: 'mixed',
                        confidence: 'medium',
                        affectedMetric: 'gdpGrowthRate',
                    },
                    {
                        advisorId: 'army_chief',
                        summary: 'A body the cabinet controls can be pointed at strategic industries directly, without waiting for an independent bureau to agree that they matter.',
                        predictedDirection: 'up',
                        confidence: 'medium',
                        affectedMetric: 'stability',
                    },
                ],
                conceptIds: ['developmental_state'],
                sourceIds: POLITICAL_MINISTRY_SOURCES,
                delayedConsequences: [
                    {
                        id: 'political_ministry_first_appointments',
                        delayTurns: 2,
                        headline: 'The Ministry’s First Contracts Follow a Familiar Pattern',
                        narrative: 'The ministry’s early decisions track closely with which firms have friends in the cabinet. That may still be useful direction, or it may simply be favoritism with a technical-sounding letterhead.',
                        effects: { eliteSatisfaction: 2, gdpGrowthRate: -0.05 },
                        requiredFlags: ['planning_ministry_political'],
                        conceptIds: ['developmental_state'],
                    },
                ],
                setFlags: ['dev_agency_established', 'planning_ministry_political'],
            },
            {
                id: 'forgo_new_agency',
                text: 'Rely on existing ministries and the market',
                rationale: 'Skipping a new bureaucracy saves its salaries and avoids creating another body for firms to lobby, but it also assumes the market alone will coordinate the investments, information, and complementary industries that a dedicated agency exists to arrange.',
                immediateNarrative: 'The cabinet declines to create a new body, asking existing ministries to handle industrial questions alongside their ordinary work. Officials welcome not having a rival agency; businesses looking for a single point of contact find several, all with other priorities.',
                effects: { gdpGrowthRate: 0.02, eliteSatisfaction: 1 },
                treasuryEffect: 6,
                factionEffects: [
                    { factionId: 'business', support: 1 },
                    { factionId: 'provincial', support: -1 },
                ],
                forecasts: [
                    {
                        advisorId: 'finance_minister',
                        summary: 'Skipping the bureau keeps this year’s budget clean and keeps the state out of decisions best left to firms that already know their own costs.',
                        predictedDirection: 'up',
                        confidence: 'medium',
                        affectedMetric: 'treasury',
                        hiddenBias: 'Reports the budget line he owns. The coordination failures a missing agency leaves behind show up in someone else’s numbers, years from now.',
                    },
                    {
                        advisorId: 'labor_leader',
                        summary: 'Without any body responsible for the whole picture, workers are likely to hear about a new industry only after it has already decided who it will and will not hire.',
                        predictedDirection: 'down',
                        confidence: 'low',
                        affectedMetric: 'stability',
                    },
                ],
                conceptIds: ['developmental_state'],
                sourceIds: NO_AGENCY_SOURCES,
                delayedConsequences: [
                    {
                        id: 'no_agency_coordination_gap',
                        delayTurns: 2,
                        headline: 'Nobody Owns the Question of What Comes Next',
                        narrative: 'A promising sector stalls for want of the roads, financing, and skilled labor a coordinating body might have arranged in advance. No single ministry considers it their failure, which is itself the failure.',
                        effects: { gdpGrowthRate: -0.1 },
                        requiredFlags: ['no_planning_agency_established'],
                        conceptIds: ['developmental_state'],
                    },
                ],
                setFlags: ['no_planning_agency_established'],
            },
        ],
        ignoreOutcome: {
            id: 'pilot_agency_ignored',
            delayTurns: 2,
            headline: 'The Cabinet Never Answers the Planning Question',
            narrative: 'With no chartered agency and no explicit decision to do without one, industrial policy happens informally, through whichever minister a given businessman can reach that month.',
            effects: { gdpGrowthRate: -0.05, eliteSatisfaction: 2 },
            factionEffects: [
                { factionId: 'business', support: -2, grievance: 'The cabinet never decided who, if anyone, was responsible for industrial strategy.' },
            ],
            setsFlags: ['pilot_agency_undecided'],
            conceptIds: ['developmental_state'],
        },
    },
    {
        id: 'dev_state_comparative_advantage_debate',
        arcId: 'developmental_state',
        arcStep: 2,
        title: 'Comparative Advantage or Defiance',
        sponsorId: 'army_chief',
        brief: 'General Kallon wants a national steel and heavy machinery program, arguing that a country with no capacity to forge its own equipment can never be secure. The finance minister’s economists counter that the country has abundant labor and little capital, and every unit of steel it can produce will be more expensively made than steel bought abroad. Both cite the same handful of countries as proof.',
        stakeholderSummary: 'The military wants domestic heavy industry it does not have to import in a crisis; light manufacturers and their workers want the resources that would go to a cluster of new mills; the treasury must weigh a subsidy that may never end against the risk of staying exactly what the country already is.',
        conceptIds: ['dynamic_comparative_advantage', 'developmental_state'],
        sourceIds: COMPARATIVE_ADVANTAGE_SOURCES,
        minYear: 1970,
        backgroundTheory: 'Justin Lin’s argument is that a country’s comparative advantage at any moment is set by its factor endowments — how much labor, capital, and land it has relative to the rest of the world — and that governments do best when they help firms enter the industries those endowments already favor, then use the surplus this generates to accumulate the capital that will make more advanced industries viable in time. On this view, a labor-abundant, capital-scarce country that subsidizes steel or automobiles before it has the capital base to make them cheaply is not accelerating its development, it is taxing its comparative-advantage sectors indefinitely to prop up ones that will never stand on their own. The subsidy becomes permanent because the underlying scarcity that makes the industry uncompetitive never goes away on its own.\n\nHa-Joon Chang’s reply is that almost no country that industrialized successfully followed this rule at the time it mattered. Britain, the United States, Germany, Japan, and later South Korea all built industries — cotton mills, steel, shipbuilding, automobiles, semiconductors — that were, by the comparative-advantage logic of their own era, obviously premature. Korea in the 1960s had a comparative advantage in wigs, plywood, and cheap textiles; a planner who had followed Lin’s rule to the letter would have kept it there. What actually happened is that the state protected and subsidized firms in sectors it judged would matter later, forced them to compete on export markets once they had scale, and let the ones that could not improve go under. Chang’s claim is that comparative advantage is not simply given by nature; a determined, disciplined state can move it, and that every one of today’s rich countries did exactly that before writing rules — the WTO’s among them — that make it harder for the next country to try the same thing.\n\nThe honest complication for the developmental-state case is that Chang’s examples are also the loudest survivorship stories in economic history: the countries that defied comparative advantage and failed — and there were many, across Latin America, Africa, and South Asia, that also protected heavy industry for decades — get much less attention than the two or three that succeeded. Lin’s answer, and the strongest case against defiance as a general strategy, is that we do not have a reliable way to tell in advance which defiant bet is Korea’s POSCO and which is a similarly ambitious project that spent forty years as a permanent drain on the treasury with nothing to show for it.',
        options: [
            {
                id: 'back_endowment_consistent_sectors',
                text: 'Back sectors consistent with the country’s factor endowment',
                rationale: 'Backing labor-intensive light manufacturing plays directly to what the country already has in abundance, but it forgoes any attempt to build the heavier capital-goods industries a comparative-advantage strategy says must wait for capital to accumulate first.',
                immediateNarrative: 'The bureau directs its limited credit and export promotion toward textiles, garments, and light assembly — industries the country can already run cheaply. General Kallon’s steel proposal is shelved for a future in which capital is less scarce.',
                effects: { gdpGrowthRate: 0.2, eliteSatisfaction: 1 },
                treasuryEffect: 8,
                factionEffects: [
                    { factionId: 'business', support: 4 },
                    { factionId: 'labor', support: 5 },
                    { factionId: 'military', support: -4, radicalization: 2 },
                ],
                forecasts: [
                    {
                        advisorId: 'finance_minister',
                        summary: 'Sectors that already fit the country’s labor supply should absorb workers and earn foreign exchange quickly, without the treasury underwriting an industry that fights the country’s own factor prices.',
                        predictedDirection: 'up',
                        confidence: 'high',
                        affectedMetric: 'gdpGrowthRate',
                    },
                    {
                        advisorId: 'army_chief',
                        summary: 'A country that only ever makes what it is already cheap to make will still be importing every rifle and every engine block the day it needs them most.',
                        predictedDirection: 'down',
                        confidence: 'medium',
                        affectedMetric: 'stability',
                    },
                ],
                conceptIds: ['dynamic_comparative_advantage'],
                sourceIds: LIN_CHANG_SOURCES,
                delayedConsequences: [
                    {
                        id: 'endowment_sectors_expand',
                        delayTurns: 2,
                        headline: 'Light Manufacturing Absorbs a Generation of Workers',
                        narrative: 'Textile and assembly exports grow steadily and the treasury banks a real surplus. The heavy industry the military wanted remains a line item nobody has funded, and the capital base to build it later is only now beginning to accumulate.',
                        effects: { gdpGrowthRate: 0.15, stability: -1 },
                        requiredFlags: ['backed_endowment_sectors'],
                        conceptIds: ['dynamic_comparative_advantage'],
                    },
                ],
                setFlags: ['backed_endowment_sectors'],
            },
            {
                id: 'defy_endowment_target_heavy_industry',
                text: 'Defy the endowment and target heavy industry',
                rationale: 'Subsidizing steel and heavy machinery now, ahead of the capital base that would ordinarily justify it, follows the path Chang credits with building every mature industrial economy, but it commits the treasury to an open-ended subsidy until, or unless, the sector actually learns to compete.',
                immediateNarrative: 'The bureau approves a national steel and machinery program, backed by protected credit and a captive domestic market. Ground breaks on a mill General Kallon has wanted for a decade; economists at the finance ministry file a formal objection for the record.',
                effects: { gdpGrowthRate: -0.05, eliteSatisfaction: -3, stability: 1 },
                treasuryEffect: -32,
                factionEffects: [
                    { factionId: 'military', support: 8, power: 2 },
                    { factionId: 'business', support: 2 },
                    { factionId: 'labor', support: -2 },
                ],
                forecasts: [
                    {
                        advisorId: 'army_chief',
                        summary: 'A domestic mill means the country is never again one embargo away from having no steel at all, and the machinery trades that grow up around it should eventually pay for the subsidy that started them.',
                        predictedDirection: 'up',
                        confidence: 'medium',
                        affectedMetric: 'gdpGrowthRate',
                        hiddenBias: 'His forecast is about strategic self-sufficiency, which is his mandate. The subsidy bill belongs to the treasury, not the barracks, and he is not the one who has to balance it.',
                    },
                    {
                        advisorId: 'finance_minister',
                        summary: 'Every year the mill cannot match an imported price is a year the treasury pays the difference, and there is no fixed date on which that stops being true.',
                        predictedDirection: 'down',
                        confidence: 'medium',
                        affectedMetric: 'treasury',
                    },
                ],
                conceptIds: ['dynamic_comparative_advantage', 'infant_industry'],
                sourceIds: DEFY_SOURCES,
                createsPromise: {
                    id: 'discipline_the_champions',
                    description: 'Hold the heavy industry program to the output and export targets used to justify its subsidy, rather than let protection become permanent',
                    factionId: 'labor',
                    deadlineTurns: 6,
                    completionFlag: 'heavy_industry_discipline_enforced',
                },
                delayedConsequences: [
                    {
                        id: 'heavy_industry_first_output',
                        delayTurns: 2,
                        headline: 'The Mill Produces Its First Domestic Steel',
                        narrative: 'The mill ships its first domestic steel, at a cost well above the imported price. Whether this is the beginning of a real industry or a permanent transfer to a politically connected firm depends entirely on what happens the day its subsidy comes up for review.',
                        effects: { gdpGrowthRate: -0.1, externalDebt: 6 },
                        requiredFlags: ['defied_comparative_advantage_heavy_industry'],
                        conceptIds: ['infant_industry'],
                    },
                ],
                setFlags: ['defied_comparative_advantage_heavy_industry'],
            },
            {
                id: 'let_market_decide',
                text: 'Let the market allocate capital without a sector target',
                rationale: 'Declining to pick a side in the endowment debate avoids the risk of an expensive wrong bet and lets capital flow to whatever investors judge most profitable, but it also forgoes any claim that the state can see further than the market it is refusing to override.',
                immediateNarrative: 'The bureau publishes no sector priorities and removes itself from the argument, leaving credit allocation to ordinary banks and investors. General Kallon calls it an abdication; the finance minister calls it humility about what anyone in the capital actually knows.',
                effects: { gdpGrowthRate: 0.05, eliteSatisfaction: 1 },
                treasuryEffect: 4,
                factionEffects: [
                    { factionId: 'business', support: 3 },
                    { factionId: 'military', support: -2 },
                ],
                forecasts: [
                    {
                        advisorId: 'finance_minister',
                        summary: 'Investors who risk their own capital have sharper incentives to judge a sector correctly than a ministry spending the treasury’s, whichever side of the endowment debate turns out to be right.',
                        predictedDirection: 'mixed',
                        confidence: 'medium',
                        affectedMetric: 'gdpGrowthRate',
                    },
                    {
                        advisorId: 'labor_leader',
                        summary: 'A market with no state hand on the scale will fund whatever is profitable this year, which is not the same thing as whatever builds the country’s capability for the next thirty.',
                        predictedDirection: 'mixed',
                        confidence: 'low',
                        affectedMetric: 'stability',
                    },
                ],
                conceptIds: ['dynamic_comparative_advantage'],
                sourceIds: MARKET_DECIDES_SOURCES,
                delayedConsequences: [
                    {
                        id: 'market_allocation_outcome',
                        delayTurns: 2,
                        headline: 'Capital Finds Its Own Level',
                        narrative: 'Investment flows toward whichever sectors already show the fastest returns, mostly trade and light assembly. No mill, no failure to fund one either — just the ordinary, undramatic verdict of a market nobody tried to overrule.',
                        effects: { gdpGrowthRate: 0.1 },
                        requiredFlags: ['let_market_decide_industry'],
                        conceptIds: ['dynamic_comparative_advantage'],
                    },
                ],
                setFlags: ['let_market_decide_industry'],
            },
        ],
        ignoreOutcome: {
            id: 'comparative_advantage_debate_ignored',
            delayTurns: 2,
            headline: 'The Debate Ends in Silence, Not a Decision',
            narrative: 'No sector is backed, no market is trusted, no argument is settled. Firms and generals alike stop bringing the question to a cabinet that has shown it will not answer it.',
            effects: { gdpGrowthRate: -0.05, stability: -1 },
            factionEffects: [
                { factionId: 'military', support: -3, radicalization: 2, grievance: 'The cabinet would not decide whether to build a domestic heavy industry.' },
            ],
            setsFlags: ['comparative_advantage_debate_unresolved'],
            conceptIds: ['dynamic_comparative_advantage'],
        },
    },
    {
        id: 'dev_state_discipline_test',
        arcId: 'developmental_state',
        arcStep: 3,
        title: 'Discipline',
        sponsorId: 'finance_minister',
        brief: 'Amsden’s claim was that subsidy only builds real capability where the state can impose reciprocal performance standards, and can actually let a favored firm fail if it misses them. The firms that took the state’s support now argue the targets were set for a different economic climate and ask for relief without giving up the subsidy.',
        stakeholderSummary: 'Subsidized firms want continuity without the discipline attached to it; workers and the treasury want proof the support is buying something real; the finance ministry must decide whether its own credibility depends on saying no to a firm it helped build.',
        conceptIds: ['state_capacity', 'developmental_state'],
        sourceIds: DISCIPLINE_TEST_SOURCES,
        minYear: 1976,
        backgroundTheory: 'Alice Amsden’s account of South Korea’s industrialization is not that subsidy worked because the state was generous, but that it worked because the state was disciplined: firms received cheap credit, tax breaks, and protection, and in exchange had to meet export quotas, output targets, or price ceilings that were actually enforced. A firm that missed its targets lost its subsidy, was merged into a stronger competitor, or in some documented cases was allowed to go bankrupt outright, regardless of how many workers it employed or how well connected its owners were. The subsidy was never the point; the reciprocal control mechanism was, because it substituted for the market discipline that free trade would otherwise have imposed, without exposing an infant sector to full international competition before it was ready.\n\nThe case against treating this as a repeatable recipe is that reciprocity of this kind demands a state capacity that is extremely rare and expensive to build: officials who can measure output and export performance accurately, resist a firm’s lobbying and a minister’s patronage instincts at the same time, and be willing to impose real, visible losses — plant closures, job losses, a politically connected owner’s public failure — in the service of a policy whose success is only provable in hindsight. Most states that have tried the Korean model got the subsidy right and the discipline wrong: protection without a credible threat of withdrawal, which is indistinguishable, in its effects, from simple rent extraction. The uncomfortable possibility is that discipline was never really a policy choice available on demand; it may have depended on a particular, hard-to-replicate configuration of an autonomous bureaucracy, a threatened security environment, and a leadership willing to bear the political cost of letting a champion fail.',
        options: [
            {
                id: 'enforce_reciprocal_discipline',
                text: 'Enforce the targets and let a champion fail',
                rationale: 'Holding a subsidized firm to its targets, and letting it fail publicly if it misses them, is the mechanism Amsden credits with making protection productive rather than merely captured, but the state bears the immediate political and economic cost of the failure it permits.',
                immediateNarrative: 'The ministry reviews every subsidized firm against its original targets and withdraws support from the one that has missed them for three years running. The firm’s owners protest loudly; the review board’s answer, this time, does not change.',
                effects: { eliteSatisfaction: -5, gdpGrowthRate: 0.1, stability: 1 },
                treasuryEffect: 10,
                factionEffects: [
                    { factionId: 'business', support: -4, radicalization: 2 },
                    { factionId: 'labor', support: 4 },
                ],
                forecasts: [
                    {
                        advisorId: 'finance_minister',
                        summary: 'A subsidy that can actually be withdrawn is the only kind that ever disciplines a firm; the first hard case is what tells every other recipient whether the targets are real.',
                        predictedDirection: 'up',
                        confidence: 'medium',
                        affectedMetric: 'gdpGrowthRate',
                    },
                    {
                        advisorId: 'labor_leader',
                        summary: 'Workers at the failing firm pay the immediate cost of a discipline that is supposed to protect the whole economy’s credit; that trade is only fair if the government also has something ready for them.',
                        predictedDirection: 'mixed',
                        confidence: 'medium',
                        affectedMetric: 'stability',
                    },
                ],
                conceptIds: ['state_capacity'],
                sourceIds: DISCIPLINE_SOURCES,
                delayedConsequences: [
                    {
                        id: 'discipline_claims_heavy_champion',
                        delayTurns: 2,
                        headline: 'The Steel Program Faces Its First Real Reckoning',
                        narrative: 'The firm that loses its support is the heavy-industry champion the military fought to create. Its closure is a visible, painful proof that the discipline was real — and a live question about whether the whole defiant bet on heavy industry was worth the years it cost.',
                        effects: { stability: -2, eliteSatisfaction: -2, gdpGrowthRate: 0.05 },
                        requiredFlags: ['defied_comparative_advantage_heavy_industry'],
                        conceptIds: ['state_capacity', 'dynamic_comparative_advantage'],
                    },
                    {
                        id: 'discipline_claims_light_exporter',
                        delayTurns: 2,
                        headline: 'A Light-Manufacturing Exporter Loses Its Support',
                        narrative: 'The firm that misses its targets is one of the endowment-consistent exporters the finance ministry itself had championed. Its failure is smaller and quieter, but it proves the review board will say no even to the strategy the state preferred.',
                        effects: { stability: 1, gdpGrowthRate: 0.05 },
                        requiredFlags: ['backed_endowment_sectors'],
                        conceptIds: ['state_capacity'],
                    },
                    {
                        id: 'discipline_with_no_prior_target',
                        delayTurns: 2,
                        headline: 'The Review Board Improvises a Standard',
                        narrative: 'With no sector strategy on record to measure against, the review board writes its performance targets after the fact, and the firm it disciplines is the one that happened to be easiest to move against, not necessarily the one that most deserved it.',
                        effects: { stability: -1, eliteSatisfaction: -1 },
                        requiredFlags: ['let_market_decide_industry'],
                        conceptIds: ['state_capacity'],
                    },
                ],
                setFlags: ['heavy_industry_discipline_enforced', 'dev_state_discipline_enforced'],
            },
            {
                id: 'soften_the_terms',
                text: 'Soften the terms and extend the subsidy',
                rationale: 'Extending relief keeps firms and their workers afloat through a genuinely harder economic climate, but a subsidy that survives every missed target in practice becomes a subsidy with no target at all.',
                immediateNarrative: 'The ministry grants every subsidized firm a grace period and quietly revises its targets downward. No mill closes and no headline is written about a failed champion, which is precisely the outcome the firms lobbied for.',
                effects: { eliteSatisfaction: 3, gdpGrowthRate: -0.1, stability: 0 },
                treasuryEffect: -18,
                factionEffects: [
                    { factionId: 'business', support: 5 },
                    { factionId: 'labor', support: -2 },
                ],
                forecasts: [
                    {
                        advisorId: 'finance_minister',
                        summary: 'A grace period should keep employment steady through a rough patch in export markets, and steady employment matters more to this cabinet meeting than a review board’s original paperwork.',
                        predictedDirection: 'mixed',
                        confidence: 'medium',
                        affectedMetric: 'stability',
                        hiddenBias: 'Softening the terms buys a quiet cabinet meeting this year. It is next year’s treasury numbers, and the next reviewer’s credibility, that absorb the cost of it.',
                    },
                    {
                        advisorId: 'labor_leader',
                        summary: 'A subsidy nobody ever has to earn back stops being an investment in a future industry and starts being a permanent transfer to whoever asked first.',
                        predictedDirection: 'down',
                        confidence: 'medium',
                        affectedMetric: 'gdpGrowthRate',
                    },
                ],
                conceptIds: ['state_capacity'],
                sourceIds: SOFTEN_SOURCES,
                delayedConsequences: [
                    {
                        id: 'softened_terms_entrench_dependency',
                        delayTurns: 3,
                        headline: 'The Subsidy Becomes a Fixture, Not a Bridge',
                        narrative: 'The firms that received relief ask for another extension when the new, lower targets also prove inconvenient. Nothing about this year’s request distinguishes it from every year that will follow.',
                        effects: { gdpGrowthRate: -0.2, eliteSatisfaction: -2 },
                        requiredFlags: ['dev_state_discipline_softened'],
                        conceptIds: ['state_capacity'],
                    },
                ],
                setFlags: ['dev_state_discipline_softened'],
            },
            {
                id: 'convert_support_to_loans',
                text: 'Convert the subsidy into repayable loans',
                rationale: 'Turning a grant into a loan keeps firms funded through the difficult period while restoring at least the discipline of a balance sheet, but a loan a firm cannot actually repay simply becomes a slower, quieter version of the same subsidy.',
                immediateNarrative: 'The ministry converts outstanding grants into state loans carrying a below-market rate and a repayment schedule. Firms accept the paperwork gladly; whether the schedule is honored will only be visible several seasons from now.',
                effects: { eliteSatisfaction: -1, gdpGrowthRate: 0.02, externalDebt: 4 },
                treasuryEffect: -6,
                factionEffects: [
                    { factionId: 'business', support: 1 },
                    { factionId: 'labor', support: 1 },
                ],
                forecasts: [
                    {
                        advisorId: 'finance_minister',
                        summary: 'A loan a firm must eventually repay restores some of the pressure a pure grant removed, without the political cost of an outright refusal.',
                        predictedDirection: 'mixed',
                        confidence: 'medium',
                        affectedMetric: 'gdpGrowthRate',
                    },
                    {
                        advisorId: 'labor_leader',
                        summary: 'A loan is only discipline if the ministry is actually willing to call it in when a firm cannot pay; otherwise it is a grant with an invoice attached.',
                        predictedDirection: 'mixed',
                        confidence: 'low',
                        affectedMetric: 'stability',
                    },
                ],
                conceptIds: ['state_capacity'],
                sourceIds: LOAN_CONVERSION_SOURCES,
                delayedConsequences: [
                    {
                        id: 'converted_loans_first_repayment',
                        delayTurns: 3,
                        headline: 'The First Loan Repayments Test the New Arrangement',
                        narrative: 'Some firms repay on schedule and treat the loan as proof they can compete without a grant. Others ask for the loan itself to be forgiven, testing whether the conversion changed anything beyond the name on the ledger.',
                        effects: { gdpGrowthRate: 0.1, externalDebt: -2 },
                        requiredFlags: ['dev_state_support_converted_loans'],
                        conceptIds: ['state_capacity'],
                    },
                ],
                setFlags: ['dev_state_support_converted_loans'],
            },
        ],
        ignoreOutcome: {
            id: 'discipline_test_ignored',
            delayTurns: 2,
            headline: 'The Targets Lapse Without a Ruling',
            narrative: 'With no decision from the cabinet, subsidized firms simply keep operating under terms nobody has reviewed in years. The reciprocity Amsden described was never explicitly withdrawn; it was never explicitly enforced either.',
            effects: { gdpGrowthRate: -0.1, eliteSatisfaction: 1 },
            factionEffects: [
                { factionId: 'labor', support: -3, radicalization: 2, grievance: 'The cabinet let subsidized firms keep their support without ever checking whether they had earned it.' },
            ],
            setsFlags: ['discipline_test_unresolved'],
            conceptIds: ['state_capacity'],
        },
    },
    {
        id: 'dev_state_selection_problem',
        arcId: 'developmental_state',
        arcStep: 4,
        title: 'The Selection Problem',
        sponsorId: 'provincial_chair',
        brief: 'An independent review of two decades of industrial support finds that the firms the state backed were, disproportionately, firms already positioned to succeed on their own — well-capitalized, already exporting, already close to the capital’s ministries. The provincial chair wants to know whether the country has been funding development or funding confidence.',
        stakeholderSummary: 'Provincial firms that never made the subsidy list want to know if the whole program simply rewarded existing advantage; the subsidized firms and their ministry patrons want the review’s methodology challenged before its conclusion becomes policy; the treasury wants a defensible answer either way.',
        conceptIds: ['self_discovery', 'miracle_accounting_debate', 'developmental_state'],
        sourceIds: SELECTION_PROBLEM_SOURCES,
        minYear: 1986,
        backgroundTheory: 'Howard Pack, Kamal Saggi, and separately Marcus Noland and Howard Pack, raise a selection problem that cuts against the entire developmental-state literature’s method, not just its policy conclusions: we mostly observe successful industrial policy in countries whose economies were already succeeding for other reasons, and mostly forget the ones where similar interventions accompanied stagnation. If a bureau’s past picks correlate strongly with firm size, existing export experience, and access to the capital’s ministries even before the subsidy arrived, then the correlation between "received state support" and "grew fast" may say more about which firms a competent bureaucracy is likely to notice than about what the subsidy itself caused. Alwyn Young’s and Paul Krugman’s separate accounting exercises made a related point about East Asia’s growth more broadly: much of the celebrated miracle was ordinary factor accumulation — more capital, more educated workers, more hours worked — rather than the mysterious productivity gains a state-guided strategy is supposed to explain, which should make anyone cautious about crediting the guidance for growth that arithmetic can already explain.\n\nThe case against reading the review as decisive is that this same selection-bias argument is much harder to apply consistently than its proponents sometimes suggest. If we cannot trust success stories because we only observe intervention in economies that were already going to succeed, we equally cannot conclude from a handful of winners-picked-anyway cases that the subsidy did nothing, because the counterfactual — what those specific firms would have done without state credit, protection, or matching orders — is exactly the thing nobody can observe either. Hausmann and Rodrik’s answer, developed around the same period, is to sidestep the winner-picking question almost entirely: rather than ask the state to identify which specific firm will succeed, subsidize the information externality in "self-discovery" itself — the cost any first-mover bears in proving a new activity is viable at all, a cost from which every subsequent entrant benefits for free. That reframes the target of support from a firm to a piece of information, which changes what a review of "who got the money" should even be checking for.',
        options: [
            {
                id: 'wind_down_industrial_policy',
                text: 'Accept the review and wind the programme down',
                rationale: 'Accepting that support followed existing advantage rather than creating it argues for stopping a subsidy that cannot show it caused anything, but a two-decade programme rarely ends cleanly, and firms that came to depend on it will not distinguish a principled wind-down from an abandonment.',
                immediateNarrative: 'The cabinet accepts the review’s finding and begins phasing out industrial support on a fixed schedule. Firms that never received a subsidy welcome what looks, to them, like an overdue leveling of the field.',
                effects: { eliteSatisfaction: -3, gdpGrowthRate: 0.05, stability: 1 },
                treasuryEffect: 16,
                factionEffects: [
                    { factionId: 'business', support: -3, radicalization: 1 },
                    { factionId: 'provincial', support: 4 },
                ],
                forecasts: [
                    {
                        advisorId: 'provincial_chair',
                        summary: 'Firms that never made the capital’s subsidy list are likely to compete more confidently once the playing field stops visibly favoring firms the review itself could not show earned their place on it.',
                        predictedDirection: 'up',
                        confidence: 'medium',
                        affectedMetric: 'stability',
                    },
                    {
                        advisorId: 'finance_minister',
                        summary: 'Winding down support that cannot demonstrate its own effect should free up the treasury, though some of the firms that lose it were, whatever the review says, actually using it well.',
                        predictedDirection: 'mixed',
                        confidence: 'medium',
                        affectedMetric: 'gdpGrowthRate',
                    },
                ],
                conceptIds: ['miracle_accounting_debate'],
                sourceIds: MIRACLE_ACCOUNTING_SOURCES,
                delayedConsequences: [
                    {
                        id: 'wind_down_reveals_mixed_record',
                        delayTurns: 2,
                        headline: 'The Wind-Down Sorts Firms the Review Could Not',
                        narrative: 'Some formerly subsidized firms keep growing without their support; others contract sharply the moment it ends. The market, in the end, answers the selection question the review could only gesture at.',
                        effects: { gdpGrowthRate: 0.1, stability: -1 },
                        requiredFlags: ['industrial_policy_wound_down'],
                        conceptIds: ['miracle_accounting_debate'],
                    },
                ],
                setFlags: ['industrial_policy_wound_down'],
            },
            {
                id: 'refocus_self_discovery_externalities',
                text: 'Refocus support on self-discovery, not firms',
                rationale: 'Subsidizing the cost of proving a new activity viable, rather than a particular firm’s balance sheet, targets the externality Hausmann and Rodrik describe directly, but it requires the bureau to identify genuine first movers rather than simply redirecting the same relationships toward a new label.',
                immediateNarrative: 'The bureau rewrites its mandate around feasibility grants and shared risk for firms entering genuinely untested activities, rather than open-ended support for firms already established. The paperwork changes more than the personnel, for now.',
                effects: { gdpGrowthRate: 0.1, eliteSatisfaction: -1, stability: 1 },
                treasuryEffect: -10,
                factionEffects: [
                    { factionId: 'business', support: 1 },
                    { factionId: 'provincial', support: 2 },
                    { factionId: 'labor', support: 1 },
                ],
                forecasts: [
                    {
                        advisorId: 'finance_minister',
                        summary: 'Paying for the cost of discovering what the country can do, rather than subsidizing firms already doing it, should target the actual market failure instead of whichever firm the bureau happens to know best.',
                        predictedDirection: 'up',
                        confidence: 'medium',
                        affectedMetric: 'gdpGrowthRate',
                    },
                    {
                        advisorId: 'provincial_chair',
                        summary: 'A mandate this new is only as good as whether it reaches provincial first movers, not just the capital’s firms with a new grant application to file.',
                        predictedDirection: 'mixed',
                        confidence: 'medium',
                        affectedMetric: 'stability',
                    },
                ],
                conceptIds: ['self_discovery'],
                sourceIds: SELF_DISCOVERY_SOURCES,
                delayedConsequences: [
                    {
                        id: 'self_discovery_grants_first_results',
                        delayTurns: 3,
                        headline: 'The First Self-Discovery Grants Report Back',
                        narrative: 'A handful of genuinely new activities take root, and several imitators enter behind the first mover without needing a subsidy of their own — exactly the spillover the reform was built to capture. Others were dressed-up requests from firms the bureau already knew.',
                        effects: { gdpGrowthRate: 0.15, eliteSatisfaction: 1 },
                        requiredFlags: ['self_discovery_refocused'],
                        conceptIds: ['self_discovery'],
                    },
                ],
                setFlags: ['self_discovery_refocused'],
            },
            {
                id: 'reject_review_methodology',
                text: 'Reject the review’s methodology and continue as before',
                rationale: 'The review’s own selection-bias logic cuts both ways: it cannot rule out that the subsidized firms would have failed without support just because they also happened to be strong candidates, so dismissing its causal claim is a defensible reading of the evidence, not merely a refusal to hear it. It is also, conveniently, the answer that changes nothing about who currently benefits.',
                immediateNarrative: 'The ministry publishes a rebuttal arguing the review cannot distinguish "we picked firms that were going to succeed anyway" from "our support is what let them succeed," and continues the programme without modification. Provincial firms that hoped for a reckoning get a methods dispute instead.',
                effects: { eliteSatisfaction: 2, gdpGrowthRate: -0.02, stability: -1 },
                treasuryEffect: -8,
                factionEffects: [
                    { factionId: 'business', support: 4 },
                    { factionId: 'provincial', support: -4, radicalization: 2 },
                ],
                forecasts: [
                    {
                        advisorId: 'finance_minister',
                        summary: 'The review cannot actually observe the counterfactual it needs to prove its point, and a programme this old should not be dismantled on a study that cannot rule out its own selection bias running the other way.',
                        predictedDirection: 'mixed',
                        confidence: 'medium',
                        affectedMetric: 'gdpGrowthRate',
                        hiddenBias: 'He built this programme. An admission that the review is right is an admission that two decades of his ministry’s judgment picked winners that were never really his to pick.',
                    },
                    {
                        advisorId: 'provincial_chair',
                        summary: 'Whatever the review’s methodology, every province that never received a contract already knows which firms the ministry favors, and a rebuttal paper will not change that perception.',
                        predictedDirection: 'down',
                        confidence: 'medium',
                        affectedMetric: 'stability',
                    },
                ],
                conceptIds: ['miracle_accounting_debate', 'developmental_state'],
                sourceIds: SELECTION_SOURCES,
                delayedConsequences: [
                    {
                        id: 'review_rejection_hardens_perception',
                        delayTurns: 2,
                        headline: 'The Rebuttal Convinces No One Outside the Ministry',
                        narrative: 'The methodological dispute plays out in journals and newspapers that most affected provinces never read. What they do notice is that the subsidy list looks exactly the same as it did before the review was published.',
                        effects: { stability: -2, eliteSatisfaction: -1 },
                        requiredFlags: ['review_methodology_rejected'],
                        conceptIds: ['developmental_state'],
                    },
                ],
                setFlags: ['review_methodology_rejected'],
            },
        ],
        ignoreOutcome: {
            id: 'selection_problem_ignored',
            delayTurns: 2,
            headline: 'The Review Sits Unanswered',
            narrative: 'The cabinet neither accepts nor rebuts the review. The subsidy list stays exactly as it was, and the question of whether it ever caused anything remains, officially, undecided.',
            effects: { stability: -1, eliteSatisfaction: 1 },
            factionEffects: [
                { factionId: 'provincial', support: -3, radicalization: 2, grievance: 'The cabinet would not even respond to a review of who its industrial policy actually helped.' },
            ],
            setsFlags: ['selection_problem_unresolved'],
            conceptIds: ['miracle_accounting_debate'],
        },
    },
    {
        id: 'dev_state_premature_deindustrialization',
        arcId: 'developmental_state',
        arcStep: 5,
        title: 'Premature Deindustrialization',
        sponsorId: 'labor_leader',
        brief: 'Manufacturing employment has begun to shrink as a share of the workforce, years before the country has reached anything like the income levels at which the earlier industrializers saw the same turn. Rodrik’s diagnosis is that global competition and automation are closing the door manufacturing once held open, well before a country like this one has walked through it.',
        stakeholderSummary: 'Factory workers and the unions that represent them want the manufacturing employment base defended; a newer class of service exporters wants the country to bet on what is actually growing; provincial and treasury officials want an answer that does not simply accept a slower, less certain path to middle income.',
        conceptIds: ['premature_deindustrialization', 'middle_income_trap', 'global_value_chains'],
        sourceIds: DEINDUSTRIALIZATION_STEP_SOURCES,
        minYear: 2004,
        backgroundTheory: 'Dani Rodrik’s premature deindustrialization thesis observes that manufacturing’s share of employment is now peaking, and beginning to fall, in developing countries at a far lower level of income per capita than it did for Britain, the United States, or even the East Asian economies that industrialized a generation earlier. The explanations on offer include automation reducing the labor manufacturing needs even in the countries that still do it, global value chains letting rich countries retain design and capital-intensive stages while routing only the lowest-value assembly abroad, and Chinese manufacturing capacity absorbing a share of world demand earlier industrializers never had to compete against. Whatever the exact mix of causes, the implication is unsettling for any strategy built on the earlier East Asian playbook: manufacturing may no longer be able to absorb a large, low-skilled workforce the way it once did, which means the traditional route out of poverty — a country’s labor force moving from farm to factory to a broad middle class — may already be closing for the countries that most need it.\n\nThe case against treating this as settled is that manufacturing’s employment share is not the only measure of what industrial capability buys a country, and a state that gives up on manufacturing risks conceding the sector with the best-documented history of learning-by-doing and productivity spillovers just because its employment numbers look discouraging. Global value chains also cut the other way: a country need not build a whole automobile to capture real value and real learning from making one component of one, and the same trade data that shows manufacturing employment falling can show manufacturing value added continuing to rise. Tradable services — business process outsourcing, software, logistics coordination — are a real and growing alternative, but they generally require the literacy, connectivity, and formal-sector skills that the countries most affected by early deindustrialization often have the least of, which risks trading one hard problem, building factories, for another one just as hard, building an educated workforce, without either the factories or the education to show for the delay.',
        options: [
            {
                id: 'double_down_manufacturing',
                text: 'Double down on manufacturing incentives',
                rationale: 'Renewing and expanding manufacturing subsidies bets that the country can still out-compete for the shrinking pool of labor-intensive production, but it risks pouring resources into a share of world manufacturing employment that is contracting for reasons no single country’s incentive package can reverse.',
                immediateNarrative: 'The ministry expands tax incentives and export financing for manufacturers, treating the employment slide as a competitiveness problem the state can still fix with the tools that worked a generation ago.',
                effects: { gdpGrowthRate: 0.05, eliteSatisfaction: 1 },
                treasuryEffect: -20,
                factionEffects: [
                    { factionId: 'labor', support: 5 },
                    { factionId: 'business', support: 2 },
                ],
                forecasts: [
                    {
                        advisorId: 'labor_leader',
                        summary: 'A serious enough incentive package should be able to hold on to factory jobs for a while longer, and every year of manufacturing employment held is a year of wages this cabinet can actually point to.',
                        predictedDirection: 'up',
                        confidence: 'medium',
                        affectedMetric: 'stability',
                        hiddenBias: 'His base is the factory floor. A pivot toward services has no union he already leads, and no constituency that owes him anything for the transition.',
                    },
                    {
                        advisorId: 'finance_minister',
                        summary: 'Automation and global competition are closing this door for reasons no incentive package in one country can reverse; the treasury may simply be paying to slow an arithmetic the world economy has already decided.',
                        predictedDirection: 'down',
                        confidence: 'medium',
                        affectedMetric: 'gdpGrowthRate',
                    },
                ],
                conceptIds: ['premature_deindustrialization'],
                sourceIds: PREMATURE_DEINDUSTRIALIZATION_SOURCES,
                delayedConsequences: [
                    {
                        id: 'manufacturing_incentives_slow_the_slide',
                        delayTurns: 2,
                        headline: 'The Incentives Slow, but Do Not Reverse, the Slide',
                        narrative: 'Manufacturing employment falls more slowly than the regional trend, at real fiscal cost. The subsidy bought time, not a reversal, and the question of what that time is for remains open.',
                        effects: { gdpGrowthRate: 0.05, stability: 1 },
                        requiredFlags: ['manufacturing_doubled_down'],
                        conceptIds: ['premature_deindustrialization'],
                    },
                ],
                setFlags: ['manufacturing_doubled_down'],
            },
            {
                id: 'pivot_tradeable_services',
                text: 'Pivot state support toward tradeable services',
                rationale: 'Redirecting support toward business process outsourcing, software, and other exportable services follows Rodrik’s own suggested alternative, but these sectors demand literacy, connectivity, and formal-sector skills the workforce leaving manufacturing does not automatically have.',
                immediateNarrative: 'The bureau redirects credit and training subsidies toward exportable services: call centers, back-office processing, and a nascent software sector. The transition is welcomed by a new class of urban employers and viewed with suspicion by displaced factory workers who do not see themselves in it.',
                effects: { gdpGrowthRate: 0.15, eliteSatisfaction: 2, stability: -1 },
                treasuryEffect: -14,
                factionEffects: [
                    { factionId: 'business', support: 4 },
                    { factionId: 'labor', support: -4, radicalization: 2 },
                ],
                forecasts: [
                    {
                        advisorId: 'finance_minister',
                        summary: 'Tradeable services are where global demand is actually growing, and a country that gets there early should capture the same kind of export earnings manufacturing once provided.',
                        predictedDirection: 'up',
                        confidence: 'medium',
                        affectedMetric: 'gdpGrowthRate',
                    },
                    {
                        advisorId: 'labor_leader',
                        summary: 'A services pivot is a plan for the workforce the country wishes it had, not the one leaving the factories right now, and the gap between the two is where the unrest will come from.',
                        predictedDirection: 'down',
                        confidence: 'medium',
                        affectedMetric: 'stability',
                    },
                ],
                conceptIds: ['global_value_chains', 'premature_deindustrialization'],
                sourceIds: GLOBAL_VALUE_CHAIN_SOURCES,
                delayedConsequences: [
                    {
                        id: 'services_pivot_uneven_absorption',
                        delayTurns: 3,
                        headline: 'The Services Sector Grows Faster Than It Hires the Displaced',
                        narrative: 'Export earnings from services rise convincingly, but the workers who benefit are disproportionately the ones who already had the schooling to qualify. Former factory workers watch a genuine growth story from outside it.',
                        effects: { gdpGrowthRate: 0.15, stability: -2 },
                        requiredFlags: ['pivoted_to_tradeable_services'],
                        conceptIds: ['global_value_chains'],
                    },
                ],
                setFlags: ['pivoted_to_tradeable_services'],
            },
            {
                id: 'invest_in_capabilities_slower_path',
                text: 'Invest broadly in capabilities and accept a slower path',
                rationale: 'Building general education, infrastructure, and institutional capacity rather than betting on either manufacturing or services hedges against being wrong about which sector actually absorbs the country’s workforce, but it offers no dramatic sector to point to and asks for patience a restless workforce may not grant.',
                immediateNarrative: 'The cabinet directs new spending toward schools, technical training, and the ordinary infrastructure any sector eventually needs, declining to bet the treasury on either manufacturing’s revival or a services leap it cannot yet be sure will hire broadly.',
                effects: { educationLevel: 3, gdpGrowthRate: 0.02, stability: 1 },
                treasuryEffect: -18,
                factionEffects: [
                    { factionId: 'labor', support: 1 },
                    { factionId: 'provincial', support: 3 },
                    { factionId: 'business', support: -1 },
                ],
                forecasts: [
                    {
                        advisorId: 'provincial_chair',
                        summary: 'Capability that is not tied to one sector should still be useful whichever way the manufacturing-versus-services question eventually resolves, even though it will not look like a policy for years.',
                        predictedDirection: 'up',
                        confidence: 'medium',
                        affectedMetric: 'educationLevel',
                    },
                    {
                        advisorId: 'labor_leader',
                        summary: 'A generation of workers losing factory jobs now needs something to point to sooner than a school system will be able to give them.',
                        predictedDirection: 'mixed',
                        confidence: 'medium',
                        affectedMetric: 'stability',
                    },
                ],
                conceptIds: ['middle_income_trap', 'premature_deindustrialization'],
                sourceIds: SELF_DISCOVERY_SOURCES,
                delayedConsequences: [
                    {
                        id: 'capability_investment_pays_slowly',
                        delayTurns: 3,
                        headline: 'The Slower Path Begins to Show Results',
                        narrative: 'No single sector can claim credit, but literacy, technical skill, and infrastructure quality all improve together, giving both manufacturing and services firms a better workforce to draw on than either would have had alone.',
                        effects: { educationLevel: 2, gdpGrowthRate: 0.1 },
                        requiredFlags: ['invested_in_capabilities_slower_path'],
                        conceptIds: ['middle_income_trap'],
                    },
                ],
                setFlags: ['invested_in_capabilities_slower_path'],
            },
        ],
        ignoreOutcome: {
            id: 'premature_deindustrialization_ignored',
            delayTurns: 2,
            headline: 'The Employment Slide Continues Without a Strategy',
            narrative: 'Manufacturing employment keeps falling and no alternative absorbs the workers it releases. The country discovers, without ever deciding, what happens when premature deindustrialization meets no policy response at all.',
            effects: { gdpGrowthRate: -0.1, stability: -2 },
            factionEffects: [
                { factionId: 'labor', support: -5, radicalization: 3, grievance: 'The cabinet had no answer as factory jobs disappeared years before anyone expected them to.' },
            ],
            setsFlags: ['premature_deindustrialization_unaddressed'],
            conceptIds: ['premature_deindustrialization'],
        },
    },
] satisfies readonly PolicyProposal[];
