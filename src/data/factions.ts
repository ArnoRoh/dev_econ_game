import type { FactionDefinition } from '../engine/types';

export const FACTIONS: FactionDefinition[] = [
    {
        id: 'military',
        name: 'National Security Command',
        shortName: 'The Command',
        description: 'Senior officers who believe order and national sovereignty must come before factional politics.',
        leaderId: 'army_chief',
        priorities: ['public order', 'defence readiness', 'national sovereignty'],
        redLines: ['an uncontrolled collapse of public order', 'humiliation by a foreign power', 'an attempt to dismantle the armed forces overnight'],
    },
    {
        id: 'labor',
        name: 'Workers Congress',
        shortName: 'The Workers',
        description: 'Urban workers and organized unions seeking secure wages, safe workplaces, and a voice in development.',
        leaderId: 'labor_leader',
        priorities: ['wages and employment', 'workplace safety', 'collective bargaining'],
        redLines: ['permanent wage suppression', 'unsafe factories without recourse', 'breaking unions by force'],
    },
    {
        id: 'business',
        name: 'Industrial and Commercial League',
        shortName: 'The League',
        description: 'Manufacturers, merchants, and investors who want predictable rules, access to capital, and room to grow.',
        leaderId: 'finance_minister',
        priorities: ['fiscal credibility', 'industrial investment', 'reliable market access'],
        redLines: ['uncompensated confiscation', 'unfunded promises that threaten the currency', 'arbitrary contract cancellation'],
    },
    {
        id: 'provincial',
        name: 'Provincial Councils',
        shortName: 'The Provinces',
        description: 'Regional leaders representing rural communities that want infrastructure, land access, and a fair share of state attention.',
        leaderId: 'provincial_chair',
        priorities: ['rural infrastructure', 'secure land access', 'regional representation'],
        redLines: ['development concentrated only in the capital', 'land decisions imposed without local voice', 'persistent neglect of rural services'],
    },
];

export const FACTIONS_BY_ID: Record<FactionDefinition['id'], FactionDefinition> = Object.fromEntries(
    FACTIONS.map(faction => [faction.id, faction]),
) as Record<FactionDefinition['id'], FactionDefinition>;
