import type { Artifact } from '../engine/types';

export const ARTIFACTS: Artifact[] = [
    {
        id: 'mineral_wealth',
        name: 'Mineral Wealth',
        description: 'Abundant natural resources. Boosts GDP significantly but harm other sectors via Dutch Disease.',
        effects: {
            gdp: 500,
            gdpGrowthRate: 1.0,
            eliteSatisfaction: -10,
            stability: -5
        },
        pointCost: 3,
        tags: ['mining', 'resource_curse', 'inequality']
    },
    {
        id: 'resource_curse',
        name: 'Resource Curse',
        description: 'Immense mineral wealth inflates currency and fuels corruption. High GDP, very low stability.',
        effects: {
            gdp: 800,
            gdpGrowthRate: 2.0,
            eliteSatisfaction: 20,
            stability: -20,
            externalDebt: 200,
            educationLevel: -10
        },
        pointCost: 2,
        tags: ['mining', 'corruption', 'unrest']
    },
    {
        id: 'socialist_history',
        name: 'Socialist Legacy',
        description: 'History of central planning. High stability and education, but low efficiency.',
        effects: {
            stability: 20,
            educationLevel: 10,
            eliteSatisfaction: -20,
            gdpGrowthRate: -1.0
        },
        pointCost: 2,
        tags: ['socialist', 'statist', 'education']
    },
    {
        id: 'weak_institutions',
        name: 'Weak Institutions',
        description: 'Corruption and lack of rule of law hinder efficient development.',
        effects: {
            stability: -15,
            gdpGrowthRate: -1.5,
            eliteSatisfaction: 10,
            famineRisk: 5
        },
        pointCost: -2,
        tags: ['corruption', 'instability', 'political']
    },
    {
        id: 'informal_sector',
        name: 'Large Informal Sector',
        description: 'Majority of economy is unregulated. Hard to tax, hard to modernize.',
        effects: {
            gdp: -200,
            stability: 10,
            educationLevel: -10,
            gdpGrowthRate: 0.5
        },
        pointCost: -1,
        tags: ['poverty', 'labor', 'informal']
    },
    {
        id: 'dual_economy',
        name: 'Dual Economy',
        description: 'Modern urban sector vs traditional rural sector. High inequality.',
        effects: {
            gdp: 300,
            stability: -10,
            population: 2,
            educationLevel: 5
        },
        pointCost: 1,
        tags: ['inequality', 'urban', 'rural']
    },
    {
        id: 'export_zones',
        name: 'Special Economic Zones',
        description: 'Designated areas for FDI with tax breaks.',
        effects: {
            gdpGrowthRate: 1.5,
            internationalRelations: 20,
            externalDebt: 50,
            stability: 5
        },
        pointCost: 3,
        tags: ['trade', 'industry', 'fdi']
    },
    {
        id: 'colonial_infrastructure',
        name: 'Colonial Infrastructure',
        description: 'Railways and ports left by former empire. Good for trade.',
        effects: {
            gdpGrowthRate: 1.5,
            stability: -10,
            educationLevel: 10
        },
        pointCost: 2,
        tags: ['trade', 'infrastructure', 'colonial']
    },
    {
        id: 'coastal_access',
        name: 'Coastal Access',
        description: 'Direct access to global shipping lanes.',
        effects: {
            gdpGrowthRate: 1.2,
            internationalRelations: 10
        },
        pointCost: 1,
        tags: ['trade', 'shipping', 'geography']
    },
    {
        id: 'landlocked',
        name: 'Landlocked',
        description: 'Dependent on neighbors for trade routes. Higher import costs.',
        effects: {
            gdpGrowthRate: -0.5,
            internationalRelations: -10,
            externalDebt: 20
        },
        pointCost: -1,
        tags: ['trade', 'geography', 'poverty']
    },
    {
        id: 'fertile_land',
        name: 'Fertile Land',
        description: 'Strong agricultural base reduces famine risk.',
        effects: {
            famineRisk: -20,
            population: 1,
            gdpGrowthRate: 0.5
        },
        pointCost: 1,
        tags: ['agriculture', 'rural', 'food']
    }
];
