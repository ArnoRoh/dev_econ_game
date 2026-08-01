import type { Province } from '../engine/types';

/**
 * The seven provinces of the republic. Each is a distinct development problem
 * rather than a palette swap of the others: a primate port that already has
 * everything, a company-town highland that has wealth but not development, a
 * fertile basin whose title sits with a few families, a drought-prone
 * periphery the capital reaches last, a second coast still waiting on its
 * port, a roadless interior, and a border drawn through one people.
 *
 * `popShare` sums to 1.0 across the seven. `shape` is an SVG polygon in a
 * 0 0 100 100 viewBox; together the seven tile a plausible country silhouette
 * with the coastline along the south and south-west and the land border to
 * the north, west, and east. `cx`/`cy` sit inside their own polygon and are
 * where the map component anchors the province label.
 */
export const BASE_PROVINCES: Province[] = [
    {
        id: 'meridia_delta',
        name: 'Meridia Delta',
        blurb: 'The delta where the country’s only deep-water port meets three colonial-era rail lines built to move one empire’s exports onto one empire’s ships. Every ministry, most embassies, and a growing share of every harvest now end up here.',
        terrain: 'delta',
        group: 'Lantao',
        popShare: 0.30,
        development: 42,
        unrest: 16,
        minerals: 8,
        farmland: 25,
        coastal: true,
        shape: '66,68 88,72 70,92 38,97 36,72',
        cx: 58,
        cy: 80,
        invested: 0,
    },
    {
        id: 'kessa_highlands',
        name: 'Kessa Highlands',
        blurb: 'Terraced ridges above a concession mine that outlived the company chartered to run it. Half the district still draws its wage from the mine’s payroll; the other half works the same seams as artisanal diggers the old concession map never bothered to count.',
        terrain: 'highland',
        group: 'Kessa',
        popShare: 0.12,
        development: 15,
        unrest: 34,
        minerals: 80,
        farmland: 10,
        coastal: false,
        shape: '8,10 42,3 38,38 5,32',
        cx: 20,
        cy: 20,
        invested: 0,
    },
    {
        id: 'ondu_basin',
        name: 'Ondu Basin',
        blurb: 'Silt from three tributaries has made this the country’s granary for longer than anyone can date the practice. Title to most of the good land sits with a dozen families whose deeds predate the republic; their tenants plant a crop they will never own.',
        terrain: 'river',
        group: 'Ondu',
        popShare: 0.20,
        development: 24,
        unrest: 28,
        minerals: 10,
        farmland: 85,
        coastal: false,
        shape: '38,38 68,35 66,68 36,72',
        cx: 50,
        cy: 52,
        invested: 0,
    },
    {
        id: 'vantu_plains',
        name: 'Vantu Plains',
        blurb: 'Rain here keeps its promise roughly two years in three, and the district has learned not to plan around the third. Herders move stock along corridors older than any map the capital has drawn, well past the point where the paved road gives out.',
        terrain: 'savannah',
        group: 'Vantu',
        popShare: 0.10,
        development: 9,
        unrest: 30,
        minerals: 15,
        farmland: 20,
        coastal: false,
        shape: '42,3 70,8 90,15 68,35 38,38',
        cx: 60,
        cy: 18,
        invested: 0,
    },
    {
        id: 'feros_coast',
        name: 'Feros Coast',
        blurb: 'A second, shallower coastline of lagoons, palm groves, and fishing villages the first port’s rail spur never reached. Engineers have surveyed it twice for a second harbor; the appropriations bill has died twice in the capital.',
        terrain: 'coast',
        group: 'Feros',
        popShare: 0.13,
        development: 30,
        unrest: 20,
        minerals: 12,
        farmland: 40,
        coastal: true,
        shape: '4,68 36,72 38,97 12,85',
        cx: 20,
        cy: 80,
        invested: 0,
    },
    {
        id: 'ubale_forest',
        name: 'Ubale Forest',
        blurb: 'Mahogany, a sawmill, and a handful of logging tracks are what the state has to show for the largest, emptiest province on the map. The census taker’s count ends roughly where the road does, which is not far past the district seat.',
        terrain: 'forest',
        group: 'Ubale',
        popShare: 0.05,
        development: 17,
        unrest: 18,
        minerals: 25,
        farmland: 12,
        coastal: false,
        shape: '5,32 38,38 36,72 4,68',
        cx: 18,
        cy: 50,
        invested: 0,
    },
    {
        id: 'serengo_march',
        name: 'Serengo March',
        blurb: 'A boundary commission that never set foot here drew the frontier straight through one people’s grazing land, market towns, and burial grounds. What crosses the line without a stamp is most of what keeps the district solvent.',
        terrain: 'border',
        group: 'Serengo',
        popShare: 0.10,
        development: 19,
        unrest: 40,
        minerals: 35,
        farmland: 22,
        coastal: false,
        shape: '90,15 97,42 88,72 66,68 68,35',
        cx: 78,
        cy: 45,
        invested: 0,
    },
];

/** A fresh, independently mutable copy of the seven provinces for a new run. */
export function createProvinces(): Province[] {
    return BASE_PROVINCES.map(province => ({ ...province }));
}
