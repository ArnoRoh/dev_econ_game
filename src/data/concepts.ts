import type { EconomicConcept } from '../engine/types.ts';

/** The nine concepts in the 1960–1968 educational vertical slice. */
export const ECONOMIC_CONCEPTS = [
    {
        id: 'land_tenure',
        title: 'Land tenure and investment incentives',
        oneSentenceSummary: 'People invest more readily in land when their claim to future returns is credible, but a title alone cannot substitute for usable courts, credit, or access.',
        mechanismSteps: [
            'A secure and enforceable claim lets a farmer keep more of the return from soil improvement, irrigation, or tree planting.',
            'An insecure tenant may favor short-horizon extraction or accept high implicit rents because another actor can take the land or the harvest.',
            'The productivity and distributional result depends on whether smallholders can also reach credit, inputs, extension, and fair markets.',
        ],
        assumptions: [
            'Land claims are sufficiently clear that courts or local institutions can enforce them.',
            'The expected return from investment is larger than the cost and risk of improving the land.',
            'Reform does not remove complementary services or make farms too fragmented to use productive technology.',
        ],
        commonMisconceptions: [
            'Formal title automatically raises output for every farmer.',
            'Redistribution must reduce agricultural production.',
            'Customary tenure is always insecure or inefficient.',
        ],
        competingViews: [
            'Redistribution may improve fairness and effort, while landowners warn that uncompensated expropriation can weaken investment and political stability.',
            'Formal titling can unlock credit in some settings, but it can also exclude customary users or enable distress sales when safeguards are weak.',
        ],
        observableIndicators: ['gdp', 'gdpGrowthRate', 'famineRisk', 'eliteSatisfaction', 'stability'],
        sourceIds: ['besley_1995_property_rights', 'world_bank_2003_land_policies'],
    },
    {
        id: 'green_revolution',
        title: 'Green Revolution technology',
        oneSentenceSummary: 'High-yield seeds can raise food production when water, fertilizer, credit, and knowledge make adoption possible, while access determines who captures the gains.',
        mechanismSteps: [
            'Improved seeds raise the payoff to inputs such as water and fertilizer rather than working as a standalone technology.',
            'Extension services, roads, credit, and reliable input markets reduce the practical barriers to adoption.',
            'Higher yields can lower food prices and raise incomes, but unequal access can concentrate land and profits among larger farms.',
        ],
        assumptions: [
            'The technology fits local soils, climate, and cropping systems.',
            'Farmers can obtain complementary inputs on time and sell additional output.',
            'Public institutions can distribute research, irrigation, and extension without systematic capture.',
        ],
        commonMisconceptions: [
            'A new seed variety increases yields regardless of inputs and local conditions.',
            'Higher national output automatically means better nutrition for every household.',
            'Technology has one fixed distributional effect independent of land and credit access.',
        ],
        competingViews: [
            'Productivity growth can reduce hunger and create rural demand, while critics emphasize ecological costs and unequal access to inputs.',
            'Supporting adoption can be more important than choosing a seed package, because institutions determine whether smallholders can participate.',
        ],
        observableIndicators: ['gdp', 'gdpGrowthRate', 'famineRisk', 'educationLevel', 'eliteSatisfaction'],
        sourceIds: ['evenson_gollin_2003_green_revolution', 'pingali_2012_green_revolution'],
    },
    {
        id: 'import_substitution',
        title: 'Import substitution industrialization',
        oneSentenceSummary: 'Tariffs and local-production rules can shift demand toward domestic firms, but they may also make firms dependent on protected markets and scarce foreign exchange.',
        mechanismSteps: [
            'A tariff raises the domestic price of an imported good and gives local producers room to enter or expand.',
            'A larger protected market can support learning, supplier networks, and local capabilities if firms improve over time.',
            'Protection also raises input costs and can preserve inefficient firms, worsening prices, exports, and foreign-exchange pressure.',
        ],
        assumptions: [
            'The domestic market is large enough for firms to approach an efficient scale.',
            'Protection is paired with performance discipline rather than becoming an open-ended entitlement.',
            'The government can ration foreign exchange and inputs without creating severe bottlenecks or favoritism.',
        ],
        commonMisconceptions: [
            'Import substitution means producing every good domestically.',
            'A tariff creates competitiveness automatically.',
            'Exporting and industrial protection are always mutually exclusive.',
        ],
        competingViews: [
            'Import substitution can build capabilities where markets and infrastructure are thin, while critics focus on persistent high costs and balance-of-payments crises.',
            'The key disagreement is often about implementation and time limits, not whether learning and diversification are valuable.',
        ],
        observableIndicators: ['gdp', 'gdpGrowthRate', 'externalDebt', 'internationalRelations', 'stability'],
        sourceIds: ['bruton_1998_import_substitution', 'prebisch_1950_latin_america'],
    },
    {
        id: 'export_orientation',
        title: 'Export-oriented industrialization',
        oneSentenceSummary: 'Selling into larger external markets can reward productivity and generate foreign exchange, but success depends on capabilities, infrastructure, and resilient institutions.',
        mechanismSteps: [
            'Access to world demand lets firms specialize beyond the limits of domestic purchasing power.',
            'Export competition and buyer requirements can pressure firms to improve quality, logistics, and production methods.',
            'Export earnings relax foreign-exchange constraints, yet exposure to global downturns and concentrated products creates new risks.',
        ],
        assumptions: [
            'Ports, power, skills, and customs systems can support reliable delivery.',
            'The exchange rate and macroeconomic policy do not make exporting persistently unprofitable.',
            'Workers and domestic suppliers can share in learning rather than remaining in low-value tasks.',
        ],
        commonMisconceptions: [
            'Export orientation is simply the same as removing every trade barrier immediately.',
            'More exports always mean more domestic value added.',
            'External demand is a free substitute for domestic institutions and skills.',
        ],
        competingViews: [
            'External markets can accelerate learning and scale, while critics warn that commodity or low-wage specialization can lock in vulnerability.',
            'Selective industrial support may complement openness when it is temporary, monitored, and tied to capability building.',
        ],
        observableIndicators: ['gdp', 'gdpGrowthRate', 'externalDebt', 'internationalRelations', 'educationLevel'],
        sourceIds: ['world_bank_1993_east_asian_miracle', 'rodrik_1995_getting_interventions_right'],
    },
    {
        id: 'infant_industry',
        title: 'Infant-industry protection',
        oneSentenceSummary: 'Temporary protection may buy time for learning in a new industry, but it only pays if future productivity gains exceed the costs of shielding firms today.',
        mechanismSteps: [
            'A protected market gives a new firm time to learn production, coordinate suppliers, and build a workforce.',
            'Learning can lower future costs or create spillovers that private investors cannot capture fully at the start.',
            'Without a credible sunset, competition, or performance test, firms can invest in lobbying for protection instead of productivity.',
        ],
        assumptions: [
            'There is a plausible learning path rather than a permanent cost disadvantage.',
            'Officials can measure performance and withdraw support from firms that fail.',
            'The social value of capability and spillovers outweighs higher prices for consumers during the learning period.',
        ],
        commonMisconceptions: [
            'Every new industry deserves protection because it is new.',
            'Temporary protection naturally ends when firms mature.',
            'Low consumer prices are the only relevant measure of industrial policy.',
        ],
        competingViews: [
            'Supporters emphasize learning spillovers and coordination failures, while critics emphasize information problems, political capture, and consumers paying the bill.',
            'A narrow, conditional policy may be defensible even when broad permanent protection is not.',
        ],
        observableIndicators: ['gdpGrowthRate', 'gdp', 'externalDebt', 'eliteSatisfaction', 'internationalRelations'],
        sourceIds: ['baldwin_1969_infant_industry', 'world_bank_1993_east_asian_miracle', 'krueger_1974_rent_seeking'],
    },
    {
        id: 'labor_standards',
        title: 'Labor standards and development',
        oneSentenceSummary: 'Wage, safety, and voice rules shape both worker welfare and production, with outcomes depending on enforcement, firm capability, and the size of the informal economy.',
        mechanismSteps: [
            'Minimum conditions can reduce dangerous work and give workers more bargaining power over the distribution of productivity gains.',
            'Predictable standards may improve retention, health, and effort, while sudden compliance costs can reduce formal hiring in weak firms.',
            'If enforcement is uneven, regulated firms may lose business to informal or politically connected competitors rather than upgrading.',
        ],
        assumptions: [
            'Labor rules are clear enough to enforce and broad enough to prevent simple evasion.',
            'Firms have time and support to adjust production methods and wages.',
            'Workers can access representation without retaliation or exclusion from formal employment.',
        ],
        commonMisconceptions: [
            'Lower standards always create more development through cheaper labor.',
            'A law on the books guarantees protection in every workplace.',
            'Worker protections and productivity are necessarily opposites.',
        ],
        competingViews: [
            'Standards can protect dignity and support a productive workforce, while employers warn that poorly sequenced rules may push jobs into informality.',
            'International labor rules can prevent a race to the bottom, but local enforcement capacity remains decisive.',
        ],
        observableIndicators: ['educationLevel', 'gdpGrowthRate', 'stability', 'eliteSatisfaction', 'genderEquality'],
        sourceIds: ['ilo_1998_fundamental_principles', 'oecd_2000_core_labour_standards'],
    },
    {
        id: 'dutch_disease',
        title: 'Dutch disease and the real exchange rate',
        oneSentenceSummary: 'A resource or export boom can appreciate the real exchange rate and pull labor and capital toward the boom, making other tradable sectors less competitive.',
        mechanismSteps: [
            'A boom brings foreign currency and raises spending on domestic goods and services.',
            'Higher domestic prices or a stronger nominal currency appreciate the real exchange rate.',
            'Agriculture and manufacturing may lose export competitiveness while workers and investment move toward the boom and non-tradables.',
        ],
        assumptions: [
            'The economy is open enough for trade prices and capital flows to affect domestic resource allocation.',
            'Labor and capital can move across sectors, though not instantly or without social cost.',
            'The boom is large or persistent enough to matter relative to the rest of the economy.',
        ],
        commonMisconceptions: [
            'Dutch disease means every resource discovery is harmful.',
            'Only a nominal currency appreciation can cause the problem.',
            'A stronger currency is always evidence of improved productivity.',
        ],
        competingViews: [
            'A boom can finance infrastructure and human capital, while the disease mechanism warns that lost capabilities in tradables may be hard to rebuild.',
            'The risk depends on policy, timing, local supply constraints, and whether rents are saved or spent rapidly.',
        ],
        observableIndicators: ['gdp', 'gdpGrowthRate', 'externalDebt', 'internationalRelations', 'eliteSatisfaction'],
        sourceIds: ['corden_neary_1982_dutch_disease', 'frankel_2010_natural_resource_curse'],
    },
    {
        id: 'sovereign_wealth_fund',
        title: 'Sovereign wealth funds and fiscal rules',
        oneSentenceSummary: 'Saving part of a volatile resource windfall in a governed public portfolio can smooth spending and preserve wealth, but it creates an opportunity cost and cannot replace accountability.',
        mechanismSteps: [
            'The state saves some windfall revenue in financial assets instead of spending it all during the boom.',
            'A rule can stabilize the budget when prices fall and convert exhaustible resources into a longer-lived income stream.',
            'Transparent mandates, reporting, and withdrawal rules reduce the chance that the fund becomes a hidden patronage account.',
        ],
        assumptions: [
            'The government can measure resource revenue and enforce a credible deposit and withdrawal rule.',
            'The saved portfolio earns a reasonable risk-adjusted return and is managed independently enough to avoid abuse.',
            'The country still funds high-return public investments that cannot be replaced by foreign financial assets.',
        ],
        commonMisconceptions: [
            'Saving abroad means the state is refusing to develop at home.',
            'A fund automatically prevents corruption or bad fiscal choices.',
            'The best fiscal rule is the same for every commodity and country.',
        ],
        competingViews: [
            'Saving can protect future citizens and stabilize budgets, while urgent infrastructure and human-capital gaps may justify spending some revenue now.',
            'The fund is a governance tool, not a substitute for a transparent budget or a diversified tax base.',
        ],
        observableIndicators: ['treasury', 'externalDebt', 'gdpGrowthRate', 'stability', 'internationalRelations'],
        sourceIds: ['truman_2008_sovereign_wealth_funds', 'imf_2008_sovereign_wealth_funds'],
    },
    {
        id: 'resource_curse',
        title: 'The resource curse and rent seeking',
        oneSentenceSummary: 'Resource wealth can weaken diversification and public accountability when groups compete for rents, but outcomes vary sharply with institutions, policy, and the use of revenue.',
        mechanismSteps: [
            'Large rents make control of the state unusually valuable, increasing incentives for patronage, lobbying, or conflict.',
            'Volatile prices make spending and borrowing pro-cyclical, so a boom can be followed by debt and cuts when prices fall.',
            'Resource revenue can reduce pressure to build broad tax institutions, while transparent investment can instead support diversification and public goods.',
        ],
        assumptions: [
            'Resource rents are large relative to the existing tax base and productive economy.',
            'Political actors can capture or redirect revenue without effective checks.',
            'The economy has limited ability to insure against commodity-price volatility.',
        ],
        commonMisconceptions: [
            'Resources cause poverty regardless of institutions.',
            'A resource boom is equivalent to permanent national income.',
            'Corruption is the only pathway from resources to poor development outcomes.',
        ],
        competingViews: [
            'Some resource-rich countries use rents to finance capabilities and stability, while others experience rent seeking, conflict, or weakened accountability.',
            'The resource curse is best understood as a conditional risk involving institutions, timing, fiscal choices, and political coalitions.',
        ],
        observableIndicators: ['treasury', 'externalDebt', 'gdpGrowthRate', 'stability', 'eliteSatisfaction', 'factionPower'],
        sourceIds: ['auty_1993_resource_curse', 'sachs_warner_1995_natural_resource', 'frankel_2010_natural_resource_curse'],
    },
] satisfies readonly EconomicConcept[];
