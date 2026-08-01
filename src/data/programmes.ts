import type { ProgrammeId, Province } from '../engine/types';

/**
 * What an allocation of the development budget can be spent on.
 *
 * One allocation buys one programme in one province, so every year is a choice
 * about *what kind* of development to buy, not merely where. The four are
 * deliberately not ranked: each is the right answer somewhere and the wrong
 * answer somewhere else, and two of them are gated on the province actually
 * having the endowment they exploit.
 *
 * The intended tension is between roads (visible development now), schools
 * (nothing now, compounding capacity later), extraction (cash now, resentment
 * later), and irrigation (both, but only where there is farmland). A player who
 * only ever builds roads finishes with a developed country that cannot run
 * itself; one who only ever licenses mines finishes rich, resented, and
 * dependent on one commodity.
 */
export interface Programme {
    id: ProgrammeId;
    name: string;
    /** One line, present tense, what the ministry is actually doing. */
    blurb: string;
    /** What the player should expect. Qualitative on purpose — see AGENTS.md. */
    forecast: string;
    /** Cost of one build, $M. */
    cost: number;
    /** Endowment gate, if any: the province needs at least this much. */
    requires?: { field: 'minerals' | 'farmland'; atLeast: number };
    conceptIds: string[];
    sourceIds: string[];
}

export const PROGRAMMES: Programme[] = [
    {
        id: 'roads',
        name: 'Roads & Rail',
        blurb: 'Grade a road to the district seat and put the rail spur back into service.',
        forecast: 'The fastest measured development per $M anywhere, and it works everywhere. Buys no capacity to run what it builds.',
        cost: 10,
        conceptIds: ['export_orientation'],
        sourceIds: ['world_bank_1993_east_asian_miracle'],
    },
    {
        id: 'schools',
        name: 'Clinics & Schools',
        blurb: 'Post teachers and a clinical officer, and pay them enough to stay.',
        forecast: 'Almost nothing this year. Permanently raises how much development the province gets from every later allocation, and calms it.',
        cost: 10,
        conceptIds: ['labor_standards'],
        sourceIds: ['ilo_1998_fundamental_principles'],
    },
    {
        id: 'extraction',
        name: 'Extraction Licence',
        blurb: 'Licence the seams to a concessionaire and bank the signature bonus.',
        forecast: 'Pays the treasury at once and every year after. The district sees the wealth leave and says so.',
        cost: 10,
        requires: { field: 'minerals', atLeast: 40 },
        conceptIds: ['resource_curse', 'dutch_disease'],
        sourceIds: ['auty_1993_resource_curse', 'sachs_warner_1995_natural_resource'],
    },
    {
        id: 'irrigation',
        name: 'Irrigation & Extension',
        blurb: 'Line the canals and put extension officers in front of the smallholders.',
        forecast: 'Strong development and a visibly calmer district — but only where there is farmland worth watering.',
        cost: 10,
        requires: { field: 'farmland', atLeast: 40 },
        conceptIds: ['green_revolution'],
        sourceIds: ['evenson_gollin_2003_green_revolution'],
    },
];

export const PROGRAMME_BY_ID: Record<ProgrammeId, Programme> = Object.fromEntries(
    PROGRAMMES.map(programme => [programme.id, programme]),
) as Record<ProgrammeId, Programme>;

/** Whether a province has the endowment a programme needs to be worth building. */
export function isProgrammeAvailable(programme: Programme, province: Province): boolean {
    if (!programme.requires) return true;
    return province[programme.requires.field] >= programme.requires.atLeast;
}

/** Why a gated programme is unavailable, for the UI to show in place of the button. */
export function programmeBlockedReason(programme: Programme, province: Province): string | null {
    if (isProgrammeAvailable(programme, province)) return null;
    const { field, atLeast } = programme.requires!;
    const noun = field === 'minerals' ? 'mineral wealth' : 'farmland';
    return `${province.name} has too little ${noun} — needs ${atLeast}, has ${Math.round(province[field])}.`;
}
