export interface CountryStats {
    gdp: number; // In millions USD
    gdpGrowthRate: number; // Percentage
    population: number; // In millions
    stability: number; // 0-100
    eliteSatisfaction: number; // 0-100
    militaryPower: number; // 0-100
    educationLevel: number; // 0-100
    famineRisk: number; // 0-100
    internationalRelations: number; // 0-100
    genderEquality: number; // 0-100% (New v1.5 stat)
    externalDebt: number; // In millions USD
    popGrowthRate?: number; // v2.0: Tracked for UI display
}

export interface Artifact {
    id: string;
    name: string;
    description: string;
    effects: Partial<CountryStats>;
    pointCost: number; // Cost in selection points (can be negative)
    tags?: string[]; // For weighted event probabilities
}

export type StatKey = keyof CountryStats;

export interface EventOption {
    text: string;
    effects: Partial<CountryStats>; // Immediate effect (delta)
    explanation?: string; // New v1.5: Tooltip explaining the economic reasoning
    setFlags?: string[]; // v1.6: Sets narrative flags (e.g. 'allowed_sweatshops')
}

export interface GameEvent {
    id: string;
    title: string;
    description: string;
    options: EventOption[];
    minYear?: number;
    theory?: string; // Educational context explaining the economic principle
    source?: string; // Basic citation or concept name
    image?: string; // Path to image asset
    tags?: string[]; // Matches artifact tags
    reqFlags?: string[]; // v1.6: Only trigger if these flags exist
    wikiLink?: string; // v1.6: Link to Wikipedia for deep learning
    maxYear?: number; // v1.9: Event stops triggering after this year
}

export interface GameState {
    country: CountryStats;
    year: number;
    turn: number;
    artifacts: Artifact[];
    gameOver: boolean;
    gameOverReason?: string; // Relaxed from specific union type to allow diverse reasons
    flags: Record<string, boolean>; // v1.6: Persistent narrative flags
    countryName: string; // v2.1: Customizable country name
}
