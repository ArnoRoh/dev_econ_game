import type { NationalMission } from '../engine/types';

export const NATIONAL_MISSIONS: NationalMission[] = [
    {
        id: 'prosperity',
        name: 'The Prosperity Project',
        description: 'Build a broad, fast-growing economy that materially raises living standards.',
        goals: [
            { metric: 'gdp', label: 'National GDP', target: 4000, direction: 'atLeast', format: 'currency' },
            { metric: 'gdpPerCapita', label: 'GDP per citizen', target: 800, direction: 'atLeast', format: 'currency' },
            { metric: 'gdpGrowthRate', label: 'Annual growth', target: 5, direction: 'atLeast', format: 'percent' },
        ],
    },
    {
        id: 'human_development',
        name: 'The Human Development Compact',
        description: 'Turn independence into longer, safer, more capable lives for ordinary citizens.',
        goals: [
            { metric: 'educationLevel', label: 'Education', target: 70, direction: 'atLeast', format: 'percent' },
            { metric: 'genderEquality', label: 'Gender equality', target: 70, direction: 'atLeast', format: 'percent' },
            { metric: 'famineRisk', label: 'Famine risk', target: 10, direction: 'atMost', format: 'percent' },
        ],
    },
    {
        id: 'secure_republic',
        name: 'The Secure Republic Doctrine',
        description: 'Create a durable state that can survive pressure at home and command respect abroad.',
        goals: [
            { metric: 'stability', label: 'Stability', target: 75, direction: 'atLeast', format: 'percent' },
            { metric: 'militaryPower', label: 'Defence capacity', target: 55, direction: 'atLeast', format: 'percent' },
            { metric: 'internationalRelations', label: 'International standing', target: 70, direction: 'atLeast', format: 'percent' },
        ],
    },
];
