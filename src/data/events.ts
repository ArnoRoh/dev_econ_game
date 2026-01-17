import type { GameEvent } from '../engine/types';

export const EVENTS: GameEvent[] = [
    // ==========================================
    // STRUCTURAL & INDUSTRIALIZATION
    // ==========================================
    {
        id: 'dutch_disease',
        title: 'The Resource Curse',
        description: 'A massive new oil field has been discovered! The currency is surging, but our traditional agricultural exports are becoming uncompetitive as a result.',
        theory: 'Dutch Disease is an economic concept that explains the apparent relationship between the exploitation of natural resources and a decline in the manufacturing or agricultural sectors. The term was coined in 1977 by The Economist to describe the decline of the manufacturing sector in the Netherlands after the discovery of the large Groningen natural gas field in 1959.\n\nThe mechanism is primarily monetary: as foreign currency rushes in to buy the oil, the local currency appreciates (strengthens). This makes the country\'s other exports (like textiles or cocoa) more expensive for foreign buyers, and imports cheaper for domestic consumers. Effectively, the resource sector "crowds out" other tradable sectors.\n\nEscaping this requires "sterilization"—keeping the foreign inflows out of the local economy by parking them in a Sovereign Wealth Fund (like Norway) or investing in foreign assets, rather than spending the windfall immediately on domestic consumption.',
        source: 'Corden & Neary (1982)',
        wikiLink: 'https://en.wikipedia.org/wiki/Dutch_disease',
        image: 'assets/industry.png',
        tags: ['mining', 'resource_curse'],
        minYear: 1970, // Oil shocks era
        options: [
            {
                text: 'Sterilize: Sovereign Wealth Fund',
                effects: { externalDebt: -50, gdpGrowthRate: 0.2, stability: -5, eliteSatisfaction: -10 },
                explanation: 'Saving the revenue abroad prevents currency appreciation and saves for future generations, but frustrates citizens who want immediate spending.',
                setFlags: ['has_sovereign_wealth_fund']
            },
            {
                text: 'Spend: Import Luxury Goods',
                effects: { gdp: 400, gdpGrowthRate: -1.5, eliteSatisfaction: 20, famineRisk: 5 },
                explanation: 'Immediate spending boosts short-term utility but destroys local industry via currency appreciation (The "Spending Effect").'
            },
            {
                text: 'Invest in Infrastructure',
                effects: { gdp: 100, gdpGrowthRate: 0.5, externalDebt: 10, stability: 5 },
                explanation: 'Attempting to convert resource wealth into public capital (roads, power). Limits Dutch Disease if inputs are imported, but risks "absorptive capacity" bottlenecks.'
            }
        ]
    },
    {
        id: 'isi_policy',
        title: 'The Protectionism Debate',
        description: 'Local manufacturers are demanding high tariffs to protect them from "unfair" foreign competition so they can grow.',
        theory: 'Import Substitution Industrialization (ISI) is a trade and economic policy which advocates replacing foreign imports with domestic production. It is based on the premise that a country should attempt to reduce its foreign dependency through the local production of industrialized products.\n\nHistorically popular in Latin America (1950s-80s), ISI argues that developing nations are trapped in a system where they export cheap raw materials and import expensive finished goods (Prebisch-Singer hypothesis). By blocking imports, the state guarantees a market for local firms.\n\nHowever, ISI often resulted in inefficient, high-cost local monopolies that never became globally competitive. Because they had a captive market, they had no incentive to innovate. It also hurt consumers who had to pay higher prices for worse goods.',
        source: 'Raúl Prebisch',
        wikiLink: 'https://en.wikipedia.org/wiki/Import_substitution_industrialization',
        image: 'assets/industry.png',
        tags: ['industry', 'trade', 'statist'],
        options: [
            {
                text: 'Implement High Tariffs (ISI)',
                effects: { gdpGrowthRate: 0.5, internationalRelations: -20, eliteSatisfaction: 15, population: -0.2, externalDebt: 20 },
                explanation: 'Creates a protected market for local industry to learn-by-doing, but raises consumer prices and risks trade wars.',
                setFlags: ['policy_isi']
            },
            {
                text: 'Export-Oriented Industrialization (EOI)',
                effects: { gdpGrowthRate: 0.8, externalDebt: 40, internationalRelations: -5 },
                explanation: 'The "Asian Tiger" model: Subsidize firms only if they compete globally. Forces efficiency but requires state competence.',
                setFlags: ['policy_eoi']
            },
            {
                text: 'Laissez-Faire Free Trade',
                effects: { gdpGrowthRate: -0.2, gdp: 50, eliteSatisfaction: -20, internationalRelations: 10 },
                explanation: 'Consumers benefit from cheap imports, but an agrarian nation may never develop an industrial base ("Kicking away the ladder").'
            }
        ]
    },
    {
        id: 'sez_labor',
        title: 'Sweatshop Conditions',
        description: 'Foreign investors want to set up factories in a Special Economic Zone (SEZ), but they demand exemption from labor laws.',
        theory: 'The "Race to the Bottom" is a socio-economic phrase to describe government deregulation of the business environment, or reduction in tax rates, in order to attract or retain economic activity in their jurisdictions.\n\nProponents argue that "sweatshops" are the first rung on the ladder of development (Paul Krugman). A low-wage job in a factory is often an improvement over subsistence farming. As capital accumulates, wages will naturally rise.\n\nCritics argue this traps the country in low-value-added production. If the only competitive advantage is cheap labor, the country cannot upgrade its technology or skills, and investors will leave as soon as wages rise slightly.',
        source: 'Dani Rodrik / Paul Krugman',
        wikiLink: 'https://en.wikipedia.org/wiki/Race_to_the_bottom',
        image: 'assets/industry.png',
        tags: ['fdi', 'labor', 'trade'],
        options: [
            {
                text: 'Allow Sweatshops (Deregulation)',
                effects: { gdpGrowthRate: 0.5, internationalRelations: 10, stability: -15, eliteSatisfaction: 10 },
                explanation: 'Attracts immediate FDI and jobs, but creates a disgruntled urban working class.',
                setFlags: ['allowed_sweatshops']
            },
            {
                text: 'Enforce Labor Standards',
                effects: { gdpGrowthRate: -0.5, internationalRelations: -10, stability: 10, eliteSatisfaction: -10 },
                explanation: 'Protects workers but may cause capital flight to a cheaper neighbor.',
                setFlags: ['enforced_labor_laws']
            },
            {
                text: 'Status Quo (Weak Enforcement)',
                effects: { stability: -5, internationalRelations: -5 },
                explanation: 'A mix of corruption and apathy that satisfies no one.'
            }
        ]
    },
    // CHAIN EVENT: Only triggers if 'allowed_sweatshops' is true
    {
        id: 'general_strike_sweatshops',
        title: 'General Strike: Factory Fires',
        description: 'Horrific conditions in the unregulated SEZ factories have led to a massive fire. The Workers Union has paralyzed the capital.',
        theory: 'Labor Unions played a critical role in the development of the West, transforming the working class into a middle class with purchasing power. In developing nations, early unionization is often suppressed to keep exports cheap.\n\nThis conflict represents the tension between capital accumulation (profit) and distribution (wages). If wages rise faster than productivity, the country invites inflation and loses competitiveness. If wages stagnate while productivity rises, inequality explodes and demand collapses.\n\nPolitical stability requires a "social contract" where workers feel they share in the gains of growth.',
        source: 'Historical Case Studies (Triangle Shirtwaist Fire)',
        wikiLink: 'https://en.wikipedia.org/wiki/Rana_Plaza_collapse',
        image: 'assets/unrest.png',
        tags: ['labor', 'unrest', 'industry'],
        reqFlags: ['allowed_sweatshops'], // CHAIN TRIGGER
        options: [
            {
                text: 'Grant Wage Hikes & Safety Laws',
                effects: { stability: 20, eliteSatisfaction: -15, gdpGrowthRate: -0.5 },
                explanation: 'Resolves the crisis peacefully and builds a middle class, but hurts export competitiveness immediately.',
                setFlags: ['enforced_labor_laws']
            },
            {
                text: 'Military Crackdown',
                effects: { stability: -30, eliteSatisfaction: 10, militaryPower: 5, internationalRelations: -20 },
                explanation: 'Restores order quickly to protect profits, but shreds the social contract and radicalizes the opposition.',
                setFlags: ['authoritarian_turn']
            },
            {
                text: 'Blame Foreign Agitators',
                effects: { stability: -10, internationalRelations: -20, gdp: -20 },
                explanation: 'Deflects blame to nationalism, avoiding structural fixes.'
            }
        ]
    },

    // ==========================================
    // AGRICULTURE & RURAL
    // ==========================================
    {
        id: 'land_reform',
        title: 'The Land Question',
        description: 'Most arable land is held by a few dozen elite families, while millions are landless tenant farmers. Tension is at a boiling point.',
        theory: 'Land Reform is often the single most critical structural change in development. In feudal systems, landlords extract "rents" without investing in productivity. Tenants have no incentive to improve land they don\'t own.\n\nSuccessful land reform (Japan, South Korea, Taiwan) broke the power of the landed aristocracy, created a broad base of assets for the poor, and forced the elite to move their capital into manufacturing.\n\nHowever, failed land reform (Zimbabwe, Venezuela) often destroys the agricultural capital stock, disperses productive clusters, and leads to famine if the new smallholders are not supported with credit and training.',
        source: 'Klaus Deininger (World Bank)',
        wikiLink: 'https://en.wikipedia.org/wiki/Land_reform',
        image: 'assets/agriculture.png',
        tags: ['agriculture', 'inequality', 'rural'],
        options: [
            {
                text: 'Radical Redistribution',
                effects: { stability: 25, eliteSatisfaction: -50, famineRisk: 10, gdpGrowthRate: -1.0 },
                explanation: 'Massive equity gain and destroys feudal power, but disrupts production and causes capital flight.',
                setFlags: ['land_reform_enacted']
            },
            {
                text: 'Market-Assisted Reform',
                effects: { externalDebt: 60, stability: 10, eliteSatisfaction: -10, gdpGrowthRate: 0.1 },
                explanation: 'The state buys land at market prices to distribute. Peaceful and preserves legal rights, but extremely expensive.',
                setFlags: ['land_reform_enacted']
            },
            {
                text: 'Protect Property Rights',
                effects: { stability: -25, eliteSatisfaction: 10, gdpGrowthRate: 0.3 },
                explanation: 'Encourages long-term investment by landowners but risks peasant revolution.'
            }
        ]
    },
    // CHAIN EVENT: Green Revolution works better with Land Reform
    {
        id: 'green_revolution',
        title: 'The Green Revolution',
        description: 'Scientists have developed new high-yield varieties (HYV) of wheat and rice. They require expensive fertilizer and irrigation to work.',
        theory: 'The Green Revolution refers to the technology transfer initiatives in the 1960s (led by Norman Borlaug) that drastically increased crop yields via HYV seeds, fertilizers, and irrigation.\n\nIt prevented global famine as population exploded. However, it had complex social effects. Because the inputs (fertilizer, pumps) were capital-intensive, rich farmers often benefited more than poor ones, leading to land concentration.\n\nIf land reform has already happened, the benefits are widely shared. If not, the Green Revolution can actually increase rural inequality and landlessness.',
        source: 'Norman Borlaug',
        wikiLink: 'https://en.wikipedia.org/wiki/Green_Revolution',
        image: 'assets/agriculture.png',
        tags: ['agriculture', 'food', 'technology'],
        minYear: 1960,
        maxYear: 1985, // Mostly irrelevant after this era
        options: [
            {
                text: 'Subsidize Inputs for All',
                effects: { externalDebt: 30, famineRisk: -40, gdp: 50, eliteSatisfaction: 10 },
                explanation: 'Ensures wide adoption and food security, but creates a permanent fiscal burden.',
                setFlags: ['green_revolution_active']
            },
            {
                text: 'Agribusiness Model',
                effects: { gdpGrowthRate: 0.6, famineRisk: -20, stability: -10, population: -0.5 },
                explanation: 'Encourages consolidation into efficient large farms. High output, but displaces small farmers causing urban migration slums.'
            },
            {
                text: 'Organic/Traditional Only',
                effects: { famineRisk: -5, gdpGrowthRate: -0.2, stability: 5 },
                explanation: 'Environmentally sustainable but fails to achieve the massive yield jumps needed for a growing population.'
            }
        ]
    },

    // ==========================================
    // GENDER & SOCIETY (v1.5)
    // ==========================================
    {
        id: 'girls_education',
        title: 'Educate the Girl Child',
        description: 'Traditional leaders are resisting the new UN-funded program to build schools specifically for girls.',
        theory: 'Educating girls is widely considered the highest return-on-investment in development economics (Lawrence Summers). It does not just increase the labor force; it fundamentally transforms society.\n\nEducated women have fewer, healthier children (Demographic Transition), effectively ending the "Malthusian Trap". They invest more of their income into their families compared to men. They also gain political agency.\n\nResistance usually stems from a "PATRIARCHAL BARGAIN" where traditional societies view women primarily as reproducers of the lineage rather than independent economic agents.',
        source: 'Amartya Sen / World Bank',
        wikiLink: 'https://en.wikipedia.org/wiki/Female_education',
        image: 'assets/unrest.png',
        tags: ['education', 'gender', 'social'],
        options: [
            {
                text: 'Mandate & Subsidize',
                effects: { genderEquality: 15, educationLevel: 10, stability: -10, externalDebt: 10 },
                explanation: 'Directly boosts human capital and rights, triggering the demographic transition, but faces cultural backlash.',
                setFlags: ['girls_schooling']
            },
            {
                text: 'Vocational Training for Boys',
                effects: { educationLevel: 5, gdpGrowthRate: 0.2, genderEquality: -5 },
                explanation: 'Focuses on immediate industrial skills for the current workforce, reinforcing existing gender gaps.'
            },
            {
                text: 'Community Awareness Only',
                effects: { genderEquality: 5, stability: 5 },
                explanation: 'Slow, non-confrontational change that relies on persuasion rather than policy.'
            }
        ]
    },
    {
        id: 'women_workforce',
        title: 'Women in the Workforce',
        description: 'As the economy grows, there is a labor shortage. Women are willing to work, but legal and cultural barriers keep them at home.',
        theory: 'Female Labor Force Participation (FLFP) follows a U-shaped curve during development. In poor agrarian societies, women work in fields. As incomes rise (middle income), they often withdraw to domestic roles due to status/stigma. In rich economies, they return to the workforce.\n\nPolicies can flatten this U-curve. Removing legal barriers (e.g., needing husband\'s permission to work) and providing childcare effectively doubles the talent pool of the nation.\n\nThis shift also changes the "bargaining power" within the household, leading to better outcomes for children.',
        source: 'Esther Duflo / Claudia Goldin',
        wikiLink: 'https://en.wikipedia.org/wiki/Female_labor_force_participation',
        image: 'assets/industry.png',
        tags: ['labor', 'gender', 'industry'],
        options: [
            {
                text: 'Repeal Restrictive Laws',
                effects: { genderEquality: 10, gdpGrowthRate: 0.8, eliteSatisfaction: -5 },
                explanation: 'Unlocks massive labor supply, boosting potential GDP output.',
                setFlags: ['women_workforce_active']
            },
            {
                text: 'Promote Traditional Values',
                effects: { stability: 10, gdpGrowthRate: -0.2, genderEquality: -10 },
                explanation: 'Maintains social cohesion for traditionalists but stifles economic capacity.'
            },
            {
                text: 'Create "Women-Only" Factories',
                effects: { gdpGrowthRate: 0.3, genderEquality: 5, externalDebt: 5 },
                explanation: 'A segregated compromise that allows work but maintains some traditional separation.'
            }
        ]
    },

    // ==========================================
    // FINANCE & DEBT
    // ==========================================
    {
        id: 'imf_bailout',
        title: 'Balance of Payments Crisis',
        description: 'We have run out of foreign currency reserves to pay for imports and debt servicing. The IMF is offering a bailout, but the conditions are harsh.',
        theory: 'The Washington Consensus refers to a set of standard policy prescriptions recommended by the IMF and World Bank to developing countries in crisis. These usually involve "Structural Adjustment Programs" (SAPs).\n\nThe typical conditions correspond to the "Trinity": Austerity (cutting spending), Privatization (selling state assets), and Liberalization (opening markets).\n\nWhile these measures often stabilize hyperinflation and restore creditworthiness, they have been heavily criticized for causing unnecessary recession, increasing poverty by cutting safety nets, and ignoring the specific institutional constraints of developing nations.',
        source: 'John Williamson (1989)',
        wikiLink: 'https://en.wikipedia.org/wiki/Washington_Consensus',
        image: 'assets/finance.png',
        tags: ['debt', 'finance', 'crisis'],
        options: [
            {
                text: 'Accept Structural Adjustment',
                effects: { externalDebt: 150, stability: -30, gdpGrowthRate: 2.0, internationalRelations: 30 },
                explanation: 'Restores creditworthiness and monetary stability (The "Bitter Medicine"), but slashes social safety nets.',
                setFlags: ['imf_program']
            },
            {
                text: 'Default on Debt',
                effects: { externalDebt: -100, internationalRelations: -60, gdp: -400, stability: -20 },
                explanation: 'Immediate relief from payments, but cuts the nation off from global trade and capital markets for years (Autarky).'
            },
            {
                text: 'Print Money (Inflation)',
                effects: { gdp: -100, stability: -40, externalDebt: -20, eliteSatisfaction: -10 },
                explanation: 'Inflates away local debt, but destroys savings and the price mechanism (Hyperinflation risk).'
            }
        ]
    },
    // CHAIN EVENT: Triggered if IMF program was accepted
    {
        id: 'food_riots_austerity',
        title: 'IMF Bread Riots',
        description: 'The IMF required us to cut ending food subsidies as part of the "fiscal discipline". The price of bread has tripled, and the streets are burning.',
        theory: 'The "IMF Riot" is a common phenomenon in countries undergoing Structural Adjustment. Economics assumes that subsidies are "inefficient" market distortions. However, for the urban poor living on the margin, a subsidy on staple foods (like bread or fuel) is the only social safety net.\n\nRemoving it abruptly to balance a budget sheet ignores the political economy of survival. The resulting unrest often destroys more economic value than the subsidy cost in the first place.',
        source: 'Joseph Stiglitz',
        wikiLink: 'https://en.wikipedia.org/wiki/Structural_adjustment',
        image: 'assets/unrest.png',
        tags: ['unrest', 'poverty', 'crisis'],
        reqFlags: ['imf_program'], // CHAIN TRIGGER
        options: [
            {
                text: 'Restore Subsidies (Break IMF Deal)',
                effects: { famineRisk: -20, stability: 20, internationalRelations: -30, externalDebt: 0 },
                explanation: 'Saves the people but angers the creditors, ensuring no future loans.',
                setFlags: ['broke_imf_deal']
            },
            {
                text: 'Send in the Army',
                effects: { stability: -10, militaryPower: 5, population: -0.1, eliteSatisfaction: 10 },
                explanation: 'Enforces the austerity with blood. Restores investor confidence at the barrel of a gun.',
                setFlags: ['authoritarian_turn']
            },
            {
                text: ' Targeted Cash Transfers',
                effects: { externalDebt: 20, stability: 5, famineRisk: -10 },
                explanation: 'A modern compromise: remove the general subsidy but give cash specifically to the poorest.'
            }
        ]
    },
    // ==========================================
    // HEALTH, ENVIRONMENT & INFRASTRUCTURE (v1.7)
    // ==========================================
    {
        id: 'trips_pharma',
        title: 'The HIV/AIDS Crisis & Generic Meds',
        description: 'A pandemic is sweeping the nation. Western pharmaceuticals are effective but cost $10,000/patient. Local firms could copy them for $100, but this violates international IP laws (TRIPS).',
        theory: 'The TRIPS Agreement (Trade-Related Aspects of Intellectual Property Rights) sets global standards for IP. While intended to encourage R&D by protecting patents, it created a massive moral crisis during the HIV epidemic in the 90s/00s.\n\nDeveloping nations argued that public health should trump patent rights. If a government breaks a patent to save lives (Compulsory Licensing), they risk trade sanctions from the US/EU. If they respect the patent, their citizens die. This tension remains central to the debate on Global Public Goods.',
        source: 'WTO Doha Declaration',
        wikiLink: 'https://en.wikipedia.org/wiki/TRIPS_Agreement#Access_to_essential_medicines',
        image: 'assets/finance.png',
        tags: ['health', 'trade', 'crisis'],
        minYear: 1995, // TRIPS signed 1994, Crisis peaked late 90s
        options: [
            {
                text: 'Issue Compulsory License (Generics)',
                effects: { population: 0.5, internationalRelations: -25, gdpGrowthRate: 0.2, stability: 10 },
                explanation: 'Saves millions of lives by ignoring patents, but angers Western trading partners, risking sanctions.',
                setFlags: ['broke_patents']
            },
            {
                text: 'Respect Strict IP Laws',
                effects: { population: -1.0, internationalRelations: 15, stability: -15, eliteSatisfaction: 5 },
                explanation: 'Maintains good standing with the WTO and Pharma lobbies, but fails to stop the pandemic.'
            },
            {
                text: 'Negotiate Bulk Discount',
                effects: { externalDebt: 40, population: -0.2, stability: 0 },
                explanation: 'A middle ground: Buying legit drugs at a discount, but still very expensive for a poor budget.'
            }
        ]
    },
    {
        id: 'conflict_diamonds',
        title: 'Conflict Minerals Discovery',
        description: 'Diamonds have been found in the restless border provinces! Rebel groups are seizing control of the mines to fund an insurgency.',
        theory: 'Resource wealth can fuel civil war by providing "lootable" assets (Paul Collier). This is a specific form of the Resource Curse.\n\nUnlike oil (which requires deep state infrastructure), alluvial diamonds or timber can be extracted by low-tech rebels ("Lootability"). This makes conflict self-sustaining. The Kimberley Process was designed to certify that diamonds are "conflict-free" to cut off this funding.',
        source: 'Paul Collier (Greed vs Grievance)',
        wikiLink: 'https://en.wikipedia.org/wiki/Blood_diamond',
        image: 'assets/mining.png',
        tags: ['mining', 'war', 'resource_curse'],
        minYear: 1990, // Post-Cold War phenomenon
        options: [
            {
                text: 'Nationalize & Militarize Mines',
                effects: { militaryPower: 10, stability: -10, gdp: 100, internationalRelations: -10 },
                explanation: 'The state forcibly seizes the resource. Increases revenue but likely escalates the violence.',
                setFlags: ['blood_diamonds']
            },
            {
                text: 'Invite Kimberley Process Certification',
                effects: { gdp: 30, stability: 10, internationalRelations: 20 },
                explanation: 'Invites international monitors. Reduces revenue (no smuggling) but effectively de-funds the rebels.',
                setFlags: ['kimberley_certified']
            },
            {
                text: 'Ignore (Smuggler\'s Paradise)',
                effects: { eliteSatisfaction: 20, stability: -30, gdp: 10 },
                explanation: 'Corrupt officials take bribes while the region descends into warlordism.'
            }
        ]
    },
    {
        id: 'mega_dam',
        title: 'The Grand Hydroelectric Dam',
        description: 'The World Bank proposes funding a massive dam. It will power industrialization but displace 50,000 indigenous villagers.',
        theory: 'Large infrastructure projects are the hallmark of "High Modernism" (James C. Scott). Central planners see the benefits (electricity, irrigation) as "legible" and quantifiable, while the costs (displaced communities, ecology) are complex and ignored.\n\nWhile electricity is a prerequisite for growth, the human cost of these projects often leads to long-term resistance and the destruction of local social capital.',
        source: 'James C. Scott (Seeing Like a State)',
        wikiLink: 'https://en.wikipedia.org/wiki/Three_Gorges_Dam#Relocation_of_residents',
        image: 'assets/industry.png',
        tags: ['infrastructure', 'energy', 'environment'],
        options: [
            {
                text: 'Build the Dam (Evict Villagers)',
                effects: { gdpGrowthRate: 1.2, stability: -15, externalDebt: 100, internationalRelations: 10 },
                explanation: 'Unlocks massive energy capacity for industry, but creates a permanent grievance among the displaced.',
                setFlags: ['built_mega_dam']
            },
            {
                text: 'Cancel Project',
                effects: { gdpGrowthRate: -0.2, stability: 5, eliteSatisfaction: -10 },
                explanation: 'Preserves rights and ecology, but leaves the nation energy-starved.'
            },
            {
                text: 'Run-of-the-River (Smaller Scale)',
                effects: { gdpGrowthRate: 0.4, externalDebt: 40, stability: 0 },
                explanation: 'A sustainable compromise generating less power but requiring no large reservoir.'
            }
        ]
    },
    {
        id: 'cash_crop_crash',
        title: 'Cocoa Price Collapse',
        description: 'Global prices for our main export crop have crashed by 40%. Farmers are destitute.',
        theory: 'The Prebisch-Singer Hypothesis suggests that over time, the price of primary commodities (crops, minerals) falls relative to manufactured goods. This means a country relying on cocoa/coffee/cotton must run faster just to stay in the same place.\n\nFurthermore, commodity prices are highly volatile. Without diversification or a stabilization fund, these price shocks transmit directly into poverty and political instability.',
        source: 'Raúl Prebisch',
        wikiLink: 'https://en.wikipedia.org/wiki/Prebisch%E2%80%93Singer_hypothesis',
        image: 'assets/agriculture.png',
        tags: ['agriculture', 'trade', 'crisis'],
        options: [
            {
                text: 'Devalue Currency',
                effects: { gdpGrowthRate: 0.5, stability: -10, externalDebt: 10 },
                explanation: 'Makes exports cheaper and boosts farmer income in local currency, but causes inflation for everyone else.'
            },
            {
                text: 'Subsidize Farmers (Price Floor)',
                effects: { externalDebt: 50, stability: 10, eliteSatisfaction: 5 },
                explanation: 'The government buys the crop above market price. Protects the poor but bankrupts the treasury.'
            },
            {
                text: 'Austere Response (Do Nothing)',
                effects: { famineRisk: 15, stability: -20, gdp: -50 },
                explanation: 'Let the market clear. Farmers starve or migrate to city slums.'
            }
        ]
    },
    {
        id: 'ngo_republic',
        title: 'The Republic of NGOs',
        description: 'Western NGOs want to take over our rural healthcare system. They are efficient and free, but it undermines our Ministry of Health.',
        theory: 'In many fragile states, NGOs provide better services than the government. However, this can lead to a "hollow state" where the government never develops the capacity to serve its own people.\n\nCitizens stop looking to the state for legitimacy and instead look to donors. It also drains talent, as local doctors work for NGOs at 10x the government salary ("Internal Brain Drain").',
        source: 'Alice Amsden',
        wikiLink: 'https://en.wikipedia.org/wiki/Non-governmental_organization#Criticisms',
        image: 'assets/social.png',
        tags: ['social', 'aid', 'institutions'],
        options: [
            {
                text: 'Welcome NGOs (Outsource Health)',
                effects: { population: 1.0, stability: 5, eliteSatisfaction: -5, gdp: 10 },
                explanation: 'Immediate health relief provided by foreigners. High short-term utility, low long-term state capacity.',
                setFlags: ['ngo_dependency']
            },
            {
                text: 'Regulate & Coordinate',
                effects: { educationLevel: 5, population: 0.2, stability: 0 },
                explanation: 'Force NGOs to work under the Ministry\'s plan. Less efficient, but builds state legitimacy.'
            },
            {
                text: 'Ban Foreign NGOs',
                effects: { population: -0.5, famineRisk: 10, internationalRelations: -20, stability: -10 },
                explanation: 'Asserts sovereignty but removes the only safety net for the poor.'
            }
        ]
    },
    {
        id: 'currency_peg',
        title: 'The Currency Anchor',
        description: 'Inflation is volatile. The Central Bank suggests pegging our currency 1:1 to the US Dollar to import stability.',
        theory: 'The "Impossible Trinity" (Mundell-Fleming) states a country can only have 2 of 3: Free Capital Flow, Fixed Exchange Rate, and Independent Monetary Policy.\n\nPegging to the Dollar (Fixed Rate) stabilizes prices and encourages trade. However, you lose Independent Monetary Policy. If the US raises interest rates, you must too, even if your economy is in recession (e.g., Argentina Crisis 2001).',
        source: 'Mundell-Fleming Model',
        wikiLink: 'https://en.wikipedia.org/wiki/Impossible_trinity',
        image: 'assets/finance.png',
        tags: ['finance', 'macro', 'trade'],
        options: [
            {
                text: 'Peg to the Dollar',
                effects: { stability: 20, gdpGrowthRate: 0.5, externalDebt: 20 },
                explanation: 'Imports stability and lowers inflation, but binds your hands in a crisis.',
                setFlags: ['currency_peg']
            },
            {
                text: 'Float the Currency',
                effects: { stability: -5, gdpGrowthRate: 0.2, internationalRelations: 5 },
                explanation: 'The exchange rate fluctuates with the market. Good for shock absorption, bad for investor certainty.'
            },
            {
                text: 'Capital Controls',
                effects: { gdpGrowthRate: -0.5, stability: 10, externalDebt: -10 },
                explanation: 'Restrict money leaving the country. Prevents crashes but scares away all FDI.'
            }
        ]
    },
    {
        id: 'tax_haven',
        title: 'Offshore Financial Center',
        description: 'Consultants suggest we become a Tax Haven. We can charge 0% tax but huge registration fees for shell companies.',
        theory: 'Development by becoming a "Tax Haven" is a strategy used by small states (e.g., Caribbean, Luxembourg). It brings in fee revenue and high-end service jobs (lawyers, accountants).\n\nHowever, it contributes to global inequality (The "Hidden Wealth of Nations") and invites "Blacklisting" by the G7/OECD. It also brings money laundering and potentially corrupts the local political system.',
        source: 'Gabriel Zucman',
        wikiLink: 'https://en.wikipedia.org/wiki/Tax_haven',
        image: 'assets/finance.png',
        tags: ['finance', 'corruption', 'trade'],
        options: [
            {
                text: 'Become a Tax Haven',
                effects: { gdp: 200, internationalRelations: -30, eliteSatisfaction: 20, stability: 5 },
                explanation: 'Easy money from fees, but makes us a pariah state in strict global circles.',
                setFlags: ['tax_haven']
            },
            {
                text: 'Cooperate with Global Tax Laws',
                effects: { internationalRelations: 20, gdp: -20, externalDebt: 10 },
                explanation: 'We get aid and praise for transparency, but stay poor.'
            },
            {
                text: 'Hybrid Model (SEZ)',
                effects: { gdpGrowthRate: 0.3, internationalRelations: -5 },
                explanation: 'Low taxes for real factories only, not shell companies.'
            }
        ]
    },
    {
        id: 'military_base',
        title: 'Strategic Base Lease',
        description: 'A Superpower wants to lease land for a naval base. They offer $500M/year in "rent" and security guarantees.',
        theory: 'Geopolitics often trumps economics. For small, strategic nations (Djibouti, Philippines), leasing bases is a major export.\n\nIt provides guaranteed revenue and a security umbrella (deterring neighbors). However, it compromises sovereignty. The host nation becomes a target for the Superpower\'s enemies and the foreign soldiers often cause social friction (crime, prostitution) locally.',
        source: 'Realpolitik',
        wikiLink: 'https://en.wikipedia.org/wiki/Overseas_military_bases',
        image: 'assets/military.png',
        tags: ['military', 'geopolitics', 'sovereignty'],
        options: [
            {
                text: 'Lease the Base',
                effects: { gdp: 500, militaryPower: 20, internationalRelations: 10, stability: -10 },
                explanation: 'Massive cash inflow and security, but loss of sovereignty and local unrest.',
                setFlags: ['hosted_base']
            },
            {
                text: 'Refuse (Non-Aligned Movement)',
                effects: { internationalRelations: 5, eliteSatisfaction: -10, stability: 10 },
                explanation: 'Maintain neutrality and dignity. "We are not a pawn on a chessboard."',
                setFlags: ['non_aligned']
            },
            {
                text: 'Play Both Sides',
                effects: { externalDebt: -50, internationalRelations: -15, stability: -15 },
                explanation: 'Try to auction the rights to the highest bidder. Dangerous game.'
            }
        ]
    },
    {
        id: 'language_policy',
        title: 'The Language of Instruction',
        description: 'Should schools teach in the Colonial Language (English/French) or the Local Vernacular?',
        theory: 'Language policy is a deep driver of inequality. Teaching in the Colonial Language connects the elite to the global economy (World Bank jobs, trade). However, the poor rural population doesn\'t speak it at home.\n\nEvidence shows children learn best in their mother tongue early on. Forcing a foreign language results in high dropout rates and a "dual society"—a small English-speaking elite ruling over a vernacular-speaking mass.',
        source: 'Ngũgĩ wa Thiong\'o',
        wikiLink: 'https://en.wikipedia.org/wiki/Medium_of_instruction',
        image: 'assets/social.png',
        tags: ['education', 'culture', 'social'],
        options: [
            {
                text: 'Colonial Language Only',
                effects: { gdpGrowthRate: 0.5, educationLevel: -10, eliteSatisfaction: 10, stability: -5 },
                explanation: 'Creates a globally competitive elite workforce, but leaves the rural poor uneducated.',
                setFlags: ['colonial_language']
            },
            {
                text: 'Local Vernacular Primary',
                effects: { educationLevel: 15, gdpGrowthRate: -0.2, stability: 10, eliteSatisfaction: -10 },
                explanation: 'Drastically improves literacy and social inclusion, but graduates may struggle globally.',
                setFlags: ['vernacular_education']
            },
            {
                text: 'Bilingual Model',
                effects: { educationLevel: 5, externalDebt: 10, gdpGrowthRate: 0.1 },
                explanation: 'The ideal solution, but expensive to train teachers and print materials in multiple languages.'
            }
        ]
    },
    {
        id: 'climate_adaptation',
        title: 'Rising Tides',
        description: 'Coastline erosion is destroying fishing villages. Scientists warn the capital city will be underwater in 20 years.',
        theory: 'Developing nations contribute the least to climate change but suffer the most. The "Adaptation vs Mitigation" debate is cruel here.\n\nShould a poor country spend its limited budget on "Adaptation" (sea walls, drought-resistant seeds) which has no immediate economic return? Or spend on "Growth" to get rich enough to deal with it later? The "discount rate" applied to the future often dictates the choice.',
        source: 'Stern Review',
        wikiLink: 'https://en.wikipedia.org/wiki/Climate_change_adaptation',
        image: 'assets/environment.png',
        tags: ['environment', 'infrastructure', 'future'],
        minYear: 2005, // Became a major development topic recently
        options: [
            {
                text: 'Build Sea Walls (Adaptation)',
                effects: { externalDebt: 50, stability: 10, gdpGrowthRate: -0.1 },
                explanation: 'Expensive protection for the future that yields no immediate profit. "The prevention of ruin."',
                setFlags: ['climate_adapted']
            },
            {
                text: 'Ignore & Industrialize',
                effects: { gdpGrowthRate: 0.8, famineRisk: 10, stability: -20 },
                explanation: 'Grow now, worry later. Maximizes short-term exit from poverty but guarantees future disaster.'
            },
            {
                text: 'Seek Green Climate Fund Aid',
                effects: { externalDebt: 10, internationalRelations: 10, stability: 5 },
                explanation: 'Lobby rich nations to pay for the mess they made. Slow and bureaucratic.'
            }
        ]
    },
    // ==========================================
    // HISTORICAL TIMELINE: 1960s - 2020s (v1.9)
    // ==========================================
    {
        id: 'nationalization_drive',
        title: 'Commanding Heights (1960s)',
        description: 'Post-independence fervor is high. Radicals demand we seize foreign-owned banks and mines to reclaim our sovereignty.',
        theory: 'In the 1950s/60s, "State Capitalism" was the dominant model (influenced by the Soviet Union). Leaders believed the state should control the "Commanding Heights" of the economy to direct surplus into development rather than foreign dividends.\n\nWhile politically popular, these State-Owned Enterprises (SOEs) often became inefficient patronage networks, lacking the discipline of competition (The Soft Budget Constraint).',
        source: 'Daniel Yergin',
        wikiLink: 'https://en.wikipedia.org/wiki/Commanding_heights_of_the_economy',
        image: 'assets/industry.png',
        tags: ['industry', 'statist', 'sovereignty'],
        minYear: 1960,
        maxYear: 1975,
        options: [
            {
                text: 'Nationalize Everything',
                effects: { eliteSatisfaction: -30, stability: 20, gdp: 100, internationalRelations: -40 },
                explanation: 'Seizes assets for the state, but destroys foreign investor confidence for decades.',
                setFlags: ['nationalized_economy']
            },
            {
                text: 'Partial State Ownership (51%)',
                effects: { gdpGrowthRate: -0.2, internationalRelations: -10, stability: 5 },
                explanation: 'A forced joint venture. Keeps some foreign expertise but asserts control.'
            },
            {
                text: 'Encourage Private Enterprise',
                effects: { eliteSatisfaction: 20, gdpGrowthRate: 0.5, stability: -10 },
                explanation: 'The "Capitalist Road". Risks neo-colonial criticism but ensures efficiency.'
            }
        ]
    },
    {
        id: 'cold_war_proxy',
        title: 'Cold War Alignment (1970s)',
        description: 'The Americans and Soviets are both offering massive military aid, but only if we align exclusively with their bloc.',
        theory: 'During the Cold War, development aid was often a tool of geopolitical bribery ("Clientelism"). Dictators like Mobutu (Zaire) received billions despite corruption because they were anti-Communist.\n\nThis "Strategic Rent" allowed regimes to survive without being accountable to their own tax-paying citizens. When the Cold War ended, this support vanished overnight.',
        source: 'Dambisa Moyo (Dead Aid)',
        wikiLink: 'https://en.wikipedia.org/wiki/Foreign_policy_of_the_United_States#Cold_War',
        image: 'assets/military.png',
        tags: ['war', 'geopolitics', 'history'],
        minYear: 1960,
        maxYear: 1989,
        options: [
            {
                text: 'Align with USA',
                effects: { militaryPower: 20, gdp: 50, internationalRelations: 20, stability: -10 },
                explanation: 'Access to Western markets and IMF loans, but risks leftist insurgency.',
                setFlags: ['aligned_usa']
            },
            {
                text: 'Align with USSR',
                effects: { militaryPower: 30, internationalRelations: -30, eliteSatisfaction: -20 },
                explanation: 'Heavy weapons and industrial support, but isolated from global bank trade.',
                setFlags: ['aligned_ussr']
            },
            {
                text: 'Non-Aligned Movement',
                effects: { internationalRelations: 5, stability: 5, externalDebt: -10 },
                explanation: 'Play both sides. Harder to get free money, but keeps independence.'
            }
        ]
    },
    {
        id: 'oil_shock_1973',
        title: 'The Oil Shock (1973)',
        description: 'OPEC has quadrupled oil prices! Our fuel import bill has skyrocketed overnight.',
        theory: 'The 1973 Oil Crisis caused a "Terms of Trade Shock" for non-oil developing nations. They had to borrow massive amounts of "Petrodollars" from Western banks just to keep the lights on.\n\nThis borrowing spree laid the groundwork for the 1980s Debt Crisis. When interest rates eventually rose (Volcker Shock), these debts became unpayable.',
        source: 'Global Economic History',
        wikiLink: 'https://en.wikipedia.org/wiki/1973_oil_crisis',
        image: 'assets/industry.png',
        tags: ['crisis', 'finance', 'history'],
        minYear: 1973,
        maxYear: 1979,
        options: [
            {
                text: 'Borrow to Subsidize Fuel',
                effects: { externalDebt: 100, stability: 10, gdpGrowthRate: 0.2 },
                explanation: 'Kicks the can down the road. Keeps the economy running but accumulates toxic debt.'
            },
            {
                text: 'Pass Prices to Consumers',
                effects: { stability: -20, gdpGrowthRate: -1.0, famineRisk: 10 },
                explanation: 'Causes immediate recession and unrest, but keeps the budget balanced.'
            },
            {
                text: 'Ration Fuel',
                effects: { gdp: -50, eliteSatisfaction: -10, stability: -5 },
                explanation: 'Controls costs via shortage. Creates black markets and inefficiency.'
            }
        ]
    },
    {
        id: 'hyperinflation_1980s',
        title: 'Hyperinflation Spirals (1980s)',
        description: 'To pay our debts, the previous administration just printed money. Prices now double every month.',
        theory: 'Hyperinflation is almost always a fiscal problem (budget deficit) solved by monetary means (printing). Once expectations unanchor, money loses its function as a store of value (Velocity of Money skyrockets).\n\nEnding it requires a "Nominal Anchor"—usually replacing the currency entirely or pegging it to a hard foreign currency, which forces immediate cessation of deficit spending.',
        source: 'Sargent & Wallace',
        wikiLink: 'https://en.wikipedia.org/wiki/Hyperinflation',
        image: 'assets/finance.png',
        tags: ['crisis', 'finance', 'history'],
        minYear: 1980,
        maxYear: 1995,
        options: [
            {
                text: 'Shock Therapy: New Currency',
                effects: { stability: -20, gdpGrowthRate: -1.5, externalDebt: 10, internationalRelations: 10 },
                explanation: 'Wipes out savings but restores price stability instantly if credible.',
                setFlags: ['shock_therapy']
            },
            {
                text: 'Price Controls',
                effects: { famineRisk: 20, gdpGrowthRate: -1.0, stability: 5 },
                explanation: 'Bans price increases. Leads to immediate empty shelves and shortages.'
            },
            {
                text: 'Dollarization',
                effects: { internationalRelations: 20, gdpGrowthRate: 0.5, eliteSatisfaction: 10 },
                explanation: 'Adopt the US Dollar. Ends inflation forever but we lose all monetary sovereignty.'
            }
        ]
    },
    {
        id: 'capital_flight',
        title: 'Capital Flight (1980s)',
        description: 'Fearing instability, the wealthy are moving their assets to Swiss bank accounts and Miami condos.',
        theory: 'Capital Flight drains a developing nation of its investment pool. It is often driven by an overvalued exchange rate (people expect a devaluation, so they move money out now).\n\nIt creates a vicious cycle: as money leaves, the government must borrow more abroad to cover the gap, leading to more fear and more flight.',
        source: 'James Henry',
        wikiLink: 'https://en.wikipedia.org/wiki/Capital_flight',
        image: 'assets/finance.png',
        tags: ['finance', 'corruption', 'history'],
        minYear: 1980,
        maxYear: 1999,
        options: [
            {
                text: 'Impose Strict Capital Controls',
                effects: { gdpGrowthRate: -0.5, stability: 10, eliteSatisfaction: -20 },
                explanation: 'Makes it illegal to move money out. Stops the bleeding but prevents new money coming in.'
            },
            {
                text: 'Raise Interest Rates (20%)',
                effects: { gdpGrowthRate: -1.5, externalDebt: 10, internationalRelations: 5 },
                explanation: 'Rewards keeping money in local banks, but crushes local business borrowing.'
            },
            {
                text: 'Ignore it',
                effects: { gdp: -100, externalDebt: 50 },
                explanation: 'The economy slowly bleeds dry.'
            }
        ]
    },
    {
        id: 'privatization_1990s',
        title: 'The Fire Sale (1990s)',
        description: 'The IMF says our State Telecom and Airline are bleeding money. We must sell them to private investors.',
        theory: 'Privatization was a key pillar of the 1990s Washington Consensus. In theory, private owners are more efficient than bureaucrats.\n\nIn practice, without strong regulators, privatization often turned public monopolies into private monopolies (owned by the President\'s cronies). This "Oligarchization" (e.g., Russia) created a class of billionaires without improving services for the poor.',
        source: 'Joseph Stiglitz',
        wikiLink: 'https://en.wikipedia.org/wiki/Privatization#Criticism',
        image: 'assets/industry.png',
        tags: ['industry', 'history', 'corruption'],
        reqFlags: ['imf_program'],
        minYear: 1990,
        maxYear: 2005,
        options: [
            {
                text: 'Sell to Highest Bidder (Foreign)',
                effects: { gdp: 300, internationalRelations: 10, stability: -5, eliteSatisfaction: -10 },
                explanation: 'Maximizes revenue and efficiency but profits flow overseas.',
                setFlags: ['privatized_telecom']
            },
            {
                text: 'Voucher Privatization (To Citizens)',
                effects: { eliteSatisfaction: 10, stability: 5, gdpGrowthRate: 0.1 },
                explanation: 'Gives shares to the people. Often they sell them cheaply to oligarchs immediately.'
            },
            {
                text: 'Keep State Control',
                effects: { externalDebt: 20, internationalRelations: -10 },
                explanation: 'Refuse the sale. The company remains a drain on the budget.'
            }
        ]
    },
    {
        id: 'brain_drain_visa',
        title: 'The Brain Drain (1990s)',
        description: 'Western nations have introduced "High Skill Visas". Our best doctors and engineers are lining up at the embassy.',
        theory: 'Human Capital Flight is a subsidy from the poor to the rich. A developing nation pays to educate a doctor for 20 years, only for them to move to the UK/US to work.\n\nHowever, in the long run, "Brain Gain" can occur if they return with new skills or send back Remittances. But in the short run, the health and engineering sectors collapse.',
        source: 'Jagdish Bhagwati',
        wikiLink: 'https://en.wikipedia.org/wiki/Human_capital_flight',
        image: 'assets/social.png',
        tags: ['education', 'social', 'history'],
        minYear: 1990,
        options: [
            {
                text: 'Exit Tax on Graduates',
                effects: { educationLevel: -5, gdp: 20, eliteSatisfaction: -15 },
                explanation: 'Force them to pay back their tuition before leaving. Discourages education enrollment.'
            },
            {
                text: 'Diaspora Bonds',
                effects: { externalDebt: 0, gdp: 50, internationalRelations: 5 },
                explanation: 'Encourage them to leave but invest their high salaries back home.'
            },
            {
                text: 'Improve Local Salaries',
                effects: { externalDebt: 30, stability: 5 },
                explanation: 'Pay them enough to stay. Very expensive for the state budget.'
            }
        ]
    },
    {
        id: 'mobile_money',
        title: 'The Digital Leapfrog (2000s)',
        description: 'A local telecom startup wants to let people send money via SMS text messages, bypassing the corrupt banks.',
        theory: 'Financial Inclusion via "Leapfrogging". In the West, finance went Cash -> Cheques -> Cards -> Apps. In Africa (e.g., M-Pesa in Kenya), it went Cash -> SMS.\n\nThis dramatically reduced transaction costs for the poor, allowing them to save and receive money securely without a bank account. It is one of the most successful development innovations in history.',
        source: 'Tavneet Suri & William Jack',
        wikiLink: 'https://en.wikipedia.org/wiki/M-Pesa',
        image: 'assets/industry.png',
        tags: ['technology', 'finance', 'history'],
        minYear: 2005,
        options: [
            {
                text: 'Dereigulate Telecoms (Allow it)',
                effects: { gdpGrowthRate: 1.5, eliteSatisfaction: -10, stability: 10 },
                explanation: 'Unleashes a massive productivity boom. Banks hate the competition.',
                setFlags: ['mobile_banking_revolution']
            },
            {
                text: 'Protect Banking Monopoly',
                effects: { eliteSatisfaction: 10, gdpGrowthRate: -0.2 },
                explanation: 'Stifles innovation to protect politically connected bank owners.'
            },
            {
                text: 'State-Run Alternative',
                effects: { externalDebt: 10, gdpGrowthRate: 0.1 },
                explanation: 'Government tries to build its own app. Likely fails due to UX/Correction.'
            }
        ]
    },
    {
        id: 'belt_road_initiative',
        title: 'New Silk Road (2010s)',
        description: 'A new superpower offers to build a high-speed railway and deep-water port. No questions asked about human rights, unlike the West.',
        theory: 'The Belt and Road Initiative (BRI) represents a shift in development financing away from the conditional Western model (OECD) to the Chinese infrastructure-led model.\n\nIt fills a massive infrastructure gap ($1 Trillion). However, critics warn of "Debt Trap Diplomacy" (e.g., Sri Lanka port seizure) if the projects are not economically viable enough to pay back the loans.',
        source: 'Deborah Brautigam',
        wikiLink: 'https://en.wikipedia.org/wiki/Belt_and_Road_Initiative',
        image: 'assets/infrastructure.png',
        tags: ['infrastructure', 'geopolitics', 'history'],
        minYear: 2013,
        options: [
            {
                text: 'Sign the Deal (Massive Infra)',
                effects: { gdpGrowthRate: 2.0, externalDebt: 200, internationalRelations: -10 },
                explanation: 'Huge immediate growth boost, but the debt burden is colossal.',
                setFlags: ['bri_debt']
            },
            {
                text: 'Reject (Fear Debt Trap)',
                effects: { internationalRelations: 10, gdpGrowthRate: -0.1 },
                explanation: 'Stay safe but stagnant. The West praises you but offers no money.'
            },
            {
                text: 'Renegotiate (Mixed Financing)',
                effects: { externalDebt: 80, gdpGrowthRate: 0.8 },
                explanation: 'Hard bargaining for better terms. Takes years to start.'
            }
        ]
    },
    {
        id: 'tech_hub_startup',
        title: 'Silicon Savannah (2010s)',
        description: 'Tech startups are booming in the capital. Venture Capital is flowing in, but they need faster internet and fewer regulations.',
        theory: 'The "Service Export" model (like India). Instead of factories, the country sells code and BPO services.\n\nIt creates a wealthy urban middle class but often leaves the rural poor behind (The "Dual Economy" problem). It requires high education investment and reliable electricity.',
        source: 'World Bank Digital Economy Report',
        wikiLink: 'https://en.wikipedia.org/wiki/Silicon_Savannah',
        image: 'assets/technology.png',
        tags: ['technology', 'education', 'future'],
        minYear: 2010,
        options: [
            {
                text: 'Create Tech Parks (Tax Free)',
                effects: { gdpGrowthRate: 1.0, educationLevel: 5, eliteSatisfaction: 10, externalDebt: 10 },
                explanation: 'Subsidize the sector heavily. Creates high-paying jobs for the elite.',
                setFlags: ['tech_hub']
            },
            {
                text: 'Focus on Rural Internet',
                effects: { educationLevel: 10, stability: 10, gdpGrowthRate: 0.3 },
                explanation: 'Broad based digital inclusion rather than elite clusters.'
            },
            {
                text: 'Tax the Startups',
                effects: { gdp: 20, gdpGrowthRate: -0.5 },
                explanation: 'Treat them as a cash cow. They will move to Delaware/London immediately.'
            }
        ]
    }
];
