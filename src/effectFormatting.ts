import type { CountryStats } from './engine/types';

const STAT_LABELS: Record<keyof CountryStats, string> = {
    gdp: 'GDP',
    gdpGrowthRate: 'Growth',
    population: 'Population',
    stability: 'Stability',
    eliteSatisfaction: 'Elite support',
    militaryPower: 'Military',
    educationLevel: 'Education',
    famineRisk: 'Famine risk',
    internationalRelations: 'Relations',
    genderEquality: 'Gender equality',
    externalDebt: 'Debt',
    popGrowthRate: 'Population growth',
};

const LOWER_IS_BETTER = new Set<keyof CountryStats>(['famineRisk', 'externalDebt']);

export const effectTone = (key: string, value: number): 'positive' | 'negative' | 'neutral' => {
    if (value === 0) return 'neutral';
    const statKey = key as keyof CountryStats;
    const beneficial = LOWER_IS_BETTER.has(statKey) ? value < 0 : value > 0;
    return beneficial ? 'positive' : 'negative';
};

export const formatEffect = (key: string, value: number) => {
    const label = STAT_LABELS[key as keyof CountryStats] ?? key.replace(/([A-Z])/g, ' $1');
    return `${label}: ${value > 0 ? '+' : ''}${value}`;
};
