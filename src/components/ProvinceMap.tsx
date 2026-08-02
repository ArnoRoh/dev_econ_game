import { useId, useState } from 'react';
import type { JSX, KeyboardEvent } from 'react';
import type { ProgrammeId, Province, Terrain } from '../engine/types';
import { PROGRAMMES, programmeBlockedReason } from '../data/programmes';
import { LICENCE_CAP, canLicenceMore } from '../engine/provinceLogic';
import './ProvinceMap.css';

interface ProvinceMapProps {
    provinces: Province[];
    year: number;
    /** Remaining investment budget this year, $M. */
    budget: number;
    /** Cost of one investment click, $M. */
    investmentStep: number;
    selectedId: string | null;
    onSelect: (provinceId: string | null) => void;
    onBuild: (provinceId: string, programmeId: ProgrammeId, cost: number) => void;
    /** Year-over-year changes by province id. Absent/empty in the first year. */
    deltas?: Record<string, { development: number; unrest: number; minerals: number }>;
}

/* --- development ramp: deep ink -> antique gold -> pale cream ---
   Anchors are the numeric equivalents of the foundation's own --ink-700,
   --brass-300 and --paper-100 so the choropleth reads as part of the same
   printed palette rather than a second, invented one. */

type Rgb = readonly [number, number, number];

const RAMP_INK: Rgb = [22, 24, 15];
const RAMP_GOLD: Rgb = [212, 175, 55];
const RAMP_CREAM: Rgb = [246, 239, 220];

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const mixRgb = (a: Rgb, b: Rgb, t: number): string => {
    const r = Math.round(a[0] + (b[0] - a[0]) * t);
    const g = Math.round(a[1] + (b[1] - a[1]) * t);
    const bl = Math.round(a[2] + (b[2] - a[2]) * t);
    return `rgb(${r}, ${g}, ${bl})`;
};

/** Two-segment ramp so mid-development provinces land on the theme's gold rather than a muddy blend. */
const developmentColor = (development: number): string => {
    const value = clamp(development, 0, 100);
    return value <= 50 ? mixRgb(RAMP_INK, RAMP_GOLD, value / 50) : mixRgb(RAMP_GOLD, RAMP_CREAM, (value - 50) / 50);
};

/**
 * Which half of the ramp a province's fill sits on decides which tone of
 * terrain glyph and neighbouring furniture will actually show up against it.
 * The crossover matches the ramp's own midpoint so a gold, medium-contrast
 * province gets a mark that reads fine in either tone.
 */
const isDarkFill = (development: number): boolean => clamp(development, 0, 100) <= 50;

const CALM_CEILING = 30;
const RESTIVE_FLOOR = 60;

const unrestLabel = (unrest: number): string =>
    unrest > RESTIVE_FLOOR ? 'Restive' : unrest > CALM_CEILING ? 'Uneasy' : 'Calm';

/**
 * Hatching starts where the province stops being Calm, so the overlay says exactly
 * what the word says. Hatching every province that is merely populated — which a
 * lower threshold does, since almost nowhere sits at zero unrest — buries the
 * development ramp under texture and leaves the map with nothing to read.
 */
const hatchOpacity = (unrest: number): number =>
    unrest > CALM_CEILING ? clamp(0.1 + ((unrest - CALM_CEILING) / 70) * 0.42, 0, 0.52) : 0;

const TERRAIN_LABELS: Record<Terrain, string> = {
    delta: 'Delta',
    highland: 'Highland',
    river: 'River',
    savannah: 'Savannah',
    coast: 'Coastal',
    forest: 'Forest',
    border: 'Borderland',
};

const TERRAIN_LIST = Object.keys(TERRAIN_LABELS) as Terrain[];

const formatCurrency = (value: number): string => `$${Math.round(value).toLocaleString()}M`;

/**
 * Every province name is "<Place> <Feature>" — "Kessa Highlands", "Ondu Basin".
 * Setting the feature word on its own line keeps the label inside its polygon
 * instead of bleeding across the border into a neighbour.
 */
const splitLabel = (name: string): [string, string] => {
    const cut = name.lastIndexOf(' ');
    return cut === -1 ? [name, ''] : [name.slice(0, cut), name.slice(cut + 1)];
};

/* ---------------------------------------------------------------------------
   The country's silhouette isn't authored anywhere in src/data/provinces.ts —
   it only exists implicitly, as wherever the seven polygons don't share an
   edge with a neighbour. Deriving the coastline and the land frontier from
   that fact (rather than hand-tracing a hull that would silently drift out of
   sync with the province shapes) means the sheet's cartography can never
   disagree with the choropleth sitting on top of it.
   --------------------------------------------------------------------------- */

type Pt = readonly [number, number];

const parseShape = (shape: string): Pt[] =>
    shape
        .trim()
        .split(/\s+/)
        .map(pair => {
            const [x, y] = pair.split(',').map(Number);
            return [x, y] as Pt;
        });

const pointKey = (p: Pt): string => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;

interface FrontierEdge {
    p1: Pt;
    p2: Pt;
    kind: 'coast' | 'border';
}

/** An edge that belongs to exactly one province has no neighbour on its far
 * side — it is part of the republic's outer frontier. Whether that stretch of
 * frontier is drawn as coast or as a land border follows from the lone owning
 * province's own `coastal` flag. */
const frontierEdges = (provinces: Province[]): FrontierEdge[] => {
    const occurrences = new Map<string, { p1: Pt; p2: Pt; coastal: boolean }[]>();

    for (const province of provinces) {
        const points = parseShape(province.shape);
        for (let i = 0; i < points.length; i += 1) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            const a = pointKey(p1);
            const b = pointKey(p2);
            const key = a < b ? `${a}|${b}` : `${b}|${a}`;
            const list = occurrences.get(key) ?? [];
            list.push({ p1, p2, coastal: province.coastal });
            occurrences.set(key, list);
        }
    }

    const edges: FrontierEdge[] = [];
    for (const list of occurrences.values()) {
        if (list.length === 1) {
            const [{ p1, p2, coastal }] = list;
            edges.push({ p1, p2, kind: coastal ? 'coast' : 'border' });
        }
    }
    return edges;
};

/** The rough centre of the republic, used only to tell which side of a
 * frontier edge is "out to sea" or "over the border" versus "home territory". */
const countryCenter = (provinces: Province[]): Pt => {
    const n = provinces.length || 1;
    const sx = provinces.reduce((sum, p) => sum + p.cx, 0);
    const sy = provinces.reduce((sum, p) => sum + p.cy, 0);
    return [sx / n, sy / n];
};

/** The outward unit normal of an edge: whichever perpendicular points further
 * from the country's centre than the edge's own midpoint does. */
const outwardNormal = (p1: Pt, p2: Pt, center: Pt): Pt => {
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const mid: Pt = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
    const outDistance = Math.hypot(mid[0] + nx - center[0], mid[1] + ny - center[1]);
    const midDistance = Math.hypot(mid[0] - center[0], mid[1] - center[1]);
    return outDistance > midDistance ? [nx, ny] : [-nx, -ny];
};

const pointsAttr = (points: Pt[]): string => points.map(p => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');

const SEA_DEPTH = 12;
const seaQuad = (edge: FrontierEdge, center: Pt): string => {
    const [nx, ny] = outwardNormal(edge.p1, edge.p2, center);
    const p3: Pt = [edge.p2[0] + nx * SEA_DEPTH, edge.p2[1] + ny * SEA_DEPTH];
    const p4: Pt = [edge.p1[0] + nx * SEA_DEPTH, edge.p1[1] + ny * SEA_DEPTH];
    return pointsAttr([edge.p1, edge.p2, p3, p4]);
};

const BORDER_OFFSET = 1;
const borderLine = (edge: FrontierEdge, center: Pt): { x1: number; y1: number; x2: number; y2: number } => {
    const [nx, ny] = outwardNormal(edge.p1, edge.p2, center);
    return {
        x1: edge.p1[0] + nx * BORDER_OFFSET,
        y1: edge.p1[1] + ny * BORDER_OFFSET,
        x2: edge.p2[0] + nx * BORDER_OFFSET,
        y2: edge.p2[1] + ny * BORDER_OFFSET,
    };
};

/* ---------------------------------------------------------------------------
   Sheet geometry. The province polygons live in the fixed 0-100 space defined
   by src/data/provinces.ts and are never rescaled. A margin is added around
   them for the sea, the land frontier, and the printed furniture (neatline,
   cartouche, compass, scale bar) that makes this read as a plate rather than
   a diagram. SCALE compensates every stroke width, pattern tile and type size
   that existed before that margin was added, so borders and labels keep the
   same apparent weight instead of thinning out as the canvas grows around them.
   --------------------------------------------------------------------------- */

const MAP_MARGIN = 15;
const VIEW_MIN = -MAP_MARGIN;
const VIEW_SIZE = 100 + MAP_MARGIN * 2;
const SCALE = VIEW_SIZE / 100;
const FRAME_MIN = VIEW_MIN + 2;
const FRAME_SIZE = VIEW_SIZE - 4;
const FRAME_MAX = FRAME_MIN + FRAME_SIZE;

/** Small "+" registration mark, the kind a printing plate carries at its corners. */
const CornerTick = ({ x, y }: { x: number; y: number }): JSX.Element => (
    <path className="pm-corner-tick" d={`M${x - 1.6},${y} L${x + 1.6},${y} M${x},${y - 1.6} L${x},${y + 1.6}`} />
);

/* ---------------------------------------------------------------------------
   Terrain texture. Each of the seven fields gets its own hand-set glyph —
   hachures for a hillside, a reed-tuft for wetland, furrows for farmland, a
   tree mark for forest — tiled the same way the existing unrest hatch already
   is. A single stroke colour cannot survive the whole development ramp (a
   dark glyph vanishes into RAMP_INK, a light one bleaches out on RAMP_CREAM),
   so every terrain is authored twice, once in ink and once in cream, and the
   province picks whichever tone its own fill is on the wrong side of — the
   same two-variant trick the unrest hatch already uses for severity.
   --------------------------------------------------------------------------- */

const TERRAIN_TILE: Record<Terrain, [number, number]> = {
    highland: [7, 9],
    delta: [10, 11],
    river: [9, 6],
    savannah: [7, 7],
    coast: [9, 6],
    forest: [9, 9],
    border: [6, 6],
};

const terrainGlyph = (terrain: Terrain, stroke: string): JSX.Element => {
    switch (terrain) {
        case 'highland':
            // A bunched run of hachures, short-to-tall, the classic shorthand for a slope.
            return (
                <path
                    d="M1,8 L1,4.2 M3,8 L3,1.8 M5,8 L5,3.6 M7,8 L7,5.4"
                    stroke={stroke}
                    strokeWidth={0.55}
                    strokeLinecap="round"
                    fill="none"
                />
            );
        case 'delta':
            // A reed tuft: three blades fanning from a base, the engraved-map mark for marsh.
            return (
                <path
                    d="M2,10 L2,6.6 M2,6.6 L0.6,3.4 M2,6.6 L2,2.4 M2,6.6 L3.6,3.4
                       M7.5,10 L7.5,7 M7.5,7 L6.3,4.4 M7.5,7 L8.4,4.4"
                    stroke={stroke}
                    strokeWidth={0.5}
                    strokeLinecap="round"
                    fill="none"
                />
            );
        case 'river':
            // Ploughed furrows across the basin's fields.
            return (
                <path
                    d="M0,2 Q2.25,0.3 4.5,2 T9,2 M0,4.6 Q2.25,2.9 4.5,4.6 T9,4.6"
                    stroke={stroke}
                    strokeWidth={0.45}
                    fill="none"
                />
            );
        case 'savannah':
            // Sparse grass ticks, far less dense than the delta's reeds.
            return (
                <path
                    d="M1.5,5.6 L1.5,3.4 M1.1,3.6 L1.9,3.6 M5.3,6.3 L5.3,4.3 M4.9,4.5 L5.7,4.5"
                    stroke={stroke}
                    strokeWidth={0.4}
                    strokeLinecap="round"
                    fill="none"
                />
            );
        case 'coast':
            // A single low swell, standing in for dune and lagoon.
            return (
                <path d="M0,3 Q2.25,1 4.5,3 Q6.75,5 9,3" stroke={stroke} strokeWidth={0.45} fill="none" />
            );
        case 'forest':
            // A lollipop tree mark, one per tile.
            return (
                <>
                    <line x1="4.5" y1="6.5" x2="4.5" y2="8.2" stroke={stroke} strokeWidth={0.45} strokeLinecap="round" />
                    <circle cx="4.5" cy="4.6" r="1.7" fill="none" stroke={stroke} strokeWidth={0.5} />
                </>
            );
        case 'border':
        default:
            // Fine crosshatch — contested ground, not a slope or a field.
            return <path d="M0,0 L6,6 M6,0 L0,6" stroke={stroke} strokeWidth={0.4} fill="none" />;
    }
};

/**
 * Settlement buildings are rendered as small inked structures whose quantity and height
 * scale with development. They appear at thresholds: a couple of dwellings at ~10, a
 * village cluster at ~30, a town at ~60, and a dense skyline at ~85. Each is drawn with
 * fine lines matching the antique cartography style.
 */
interface SettlementBuilding {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Derive settlement buildings positioned below the label anchor to avoid occlusion.
 * Buildings appear progressively as development rises, and are clipped to stay inside the polygon.
 * Offset by +8 units vertically positions the cluster below the text label while staying in bounds.
 * Sizes are 2–3× larger than before so buildings read clearly at typical map zoom levels.
 */
const settlementBuildings = (development: number, cx: number, cy: number): SettlementBuilding[] => {
    const buildings: SettlementBuilding[] = [];
    const dev = clamp(development, 0, 100);
    // Offset downward from label anchor to avoid overlap with the province name
    const offsetY = 8;

    // Threshold 1: ~10 dev — two dwellings, 4×6 and 4×5 units
    if (dev >= 8) {
        buildings.push(
            { x: cx - 6, y: cy + offsetY - 2, width: 4, height: 6 },
            { x: cx + 2, y: cy + offsetY, width: 4, height: 5 }
        );
    }

    // Threshold 2: ~30 dev — village cluster adds 3 more buildings
    if (dev >= 25) {
        buildings.push(
            { x: cx - 9, y: cy + offsetY + 4, width: 4, height: 5 },
            { x: cx - 2, y: cy + offsetY + 5, width: 4, height: 6 },
            { x: cx + 5, y: cy + offsetY + 3, width: 4, height: 5 }
        );
    }

    // Threshold 3: ~60 dev — town adds 3 taller structures (8–9 units high)
    if (dev >= 55) {
        buildings.push(
            { x: cx - 11, y: cy + offsetY - 4, width: 3.5, height: 9 },
            { x: cx + 7, y: cy + offsetY - 2, width: 3.5, height: 8 },
            { x: cx - 5, y: cy + offsetY - 3, width: 3.5, height: 8.5 }
        );
    }

    // Threshold 4: ~85 dev — dense skyline adds 3 tallest structures (9–10.5 units high)
    if (dev >= 80) {
        buildings.push(
            { x: cx - 1, y: cy + offsetY - 8, width: 3, height: 10.5 },
            { x: cx + 3, y: cy + offsetY - 6, width: 3, height: 9.5 },
            { x: cx - 7, y: cy + offsetY - 1, width: 3, height: 7 }
        );
    }

    return buildings;
};

/**
 * Infrastructure elements: roads, ports, mines, cultivated fields. Each appears at
 * appropriate development/resource thresholds and is drawn with fine ink lines.
 */
interface InfrastructureElement {
    type: 'road' | 'rail' | 'port' | 'mine' | 'field';
    paths: string[];
    strokeWidth?: number;
}

const infrastructureElements = (province: Province): InfrastructureElement[] => {
    const elements: InfrastructureElement[] = [];
    const { development, cx, cy, coastal, minerals, farmland } = province;
    const dev = clamp(development, 0, 100);

    // Roads: simple lines extending from the anchor, branching as dev rises
    if (dev >= 15) {
        elements.push({
            type: 'road',
            paths: [
                // Main road north
                `M${cx},${cy} L${cx},${cy - 8}`,
                // Main road south
                `M${cx},${cy} L${cx},${cy + 8}`,
            ],
            strokeWidth: 0.6,
        });

        // Branches at higher development
        if (dev >= 45) {
            elements.push({
                type: 'road',
                paths: [
                    `M${cx - 3},${cy - 4} L${cx - 7},${cy - 6}`,
                    `M${cx + 3},${cy - 4} L${cx + 7},${cy - 6}`,
                ],
                strokeWidth: 0.5,
            });
        }
    }

    // Rail: dashed lines, only if development is significant
    if (dev >= 50) {
        elements.push({
            type: 'rail',
            paths: [`M${cx - 6},${cy + 3} L${cx + 6},${cy + 3}`],
            strokeWidth: 0.5,
        });
    }

    // Port: a small anchor symbol on coastal provinces past 50 dev
    if (coastal && dev >= 50) {
        elements.push({
            type: 'port',
            paths: [
                // Anchor: vertical shaft
                `M${cx + 8},${cy + 6} L${cx + 8},${cy + 10}`,
                // Anchor: flukes
                `M${cx + 6.5},${cy + 8.5} L${cx + 9.5},${cy + 8.5}`,
            ],
            strokeWidth: 0.45,
        });
    }

    // Mine: a small headframe where minerals are high
    if (minerals >= 40 && dev >= 25) {
        elements.push({
            type: 'mine',
            paths: [
                // Headframe: posts
                `M${cx - 9},${cy - 8} L${cx - 9},${cy - 5}`,
                `M${cx - 8},${cy - 8} L${cx - 8},${cy - 5}`,
                // Headframe: crossbeam
                `M${cx - 9.2},${cy - 6.8} L${cx - 7.8},${cy - 6.8}`,
            ],
            strokeWidth: 0.4,
        });
    }

    // Cultivated fields: rows of ploughed furrows where farmland is high
    if (farmland >= 40 && dev >= 20) {
        elements.push({
            type: 'field',
            paths: [
                `M${cx - 5},${cy + 5} Q${cx - 2.5},${cy + 6} ${cx},${cy + 5}`,
                `M${cx - 5},${cy + 7} Q${cx - 2.5},${cy + 8} ${cx},${cy + 7}`,
                `M${cx - 5},${cy + 9} Q${cx - 2.5},${cy + 10} ${cx},${cy + 9}`,
            ],
            strokeWidth: 0.35,
        });
    }

    return elements;
};

/**
 * Provinces render as <polygon role="button"> rather than a real <button> wrapping
 * a <path>: `shape` is a set of points meant for a single shared 100x100 viewBox, so
 * every province has to live inside one <svg> for the choropleth to line up. Nesting
 * a <button> per province would force a separate <svg> each, breaking that shared
 * coordinate space. role="button" + tabIndex + explicit key handling keeps each
 * province a real keyboard control without giving up the single map.
 */
export function ProvinceMap({
    provinces,
    year,
    budget,
    investmentStep,
    selectedId,
    onSelect,
    onBuild,
    deltas,
}: ProvinceMapProps): JSX.Element {
    const uid = useId();
    const hatchLowId = `pm-hatch-low-${uid}`;
    const hatchHighId = `pm-hatch-high-${uid}`;
    const seaPatternId = `pm-sea-${uid}`;
    const terrainPatternId = (terrain: Terrain, tone: 'ink' | 'cream'): string => `pm-terrain-${terrain}-${tone}-${uid}`;
    const provinceClipPathId = (provinceId: string): string => `pm-clip-${provinceId}-${uid}`;
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [focusedId, setFocusedId] = useState<string | null>(null);

    const selected = provinces.find(province => province.id === selectedId) ?? null;
    const canInvest = budget >= investmentStep;

    const center = countryCenter(provinces);
    const edges = frontierEdges(provinces);
    const coastEdges = edges.filter(edge => edge.kind === 'coast');
    const borderEdges = edges.filter(edge => edge.kind === 'border');

    const toggleSelection = (id: string) => onSelect(selectedId === id ? null : id);

    const handleKeyDown = (event: KeyboardEvent<SVGPolygonElement>, id: string) => {
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
            event.preventDefault();
            toggleSelection(id);
        }
    };

    // Raise the selected province to the end of paint order so its elevated scale
    // never gets clipped under a neighboring polygon. This intentionally keys off
    // selection, not hover: reordering DOM nodes mid-gesture (between a pointer's
    // enter and its click) makes some browsers drop the click that caused it, so
    // hover lift relies on CSS alone and never touches paint order.
    const orderedProvinces = selectedId
        ? [...provinces].sort((a, b) => Number(a.id === selectedId) - Number(b.id === selectedId))
        : provinces;

    // The keyboard focus ring is redrawn as a top layer rather than left to the
    // focused province's own stroke: provinces later in paint order cover a focused
    // neighbour's shared edges, so the ring comes out broken on two or three sides.
    // Redrawing the outline after every province completes it without reordering the
    // shapes — reordering on focus would move a node between a pointer's mousedown
    // and its click, which is exactly what makes some browsers drop that click.
    const focusRing =
        provinces.find(province => province.id === focusedId && province.id !== selectedId) ?? null;

    return (
        <section className="province-map-panel">
            <div className="province-map-wrap mat-paper mat-grain mat-vignette anim-settle">
                {/* Stated above the map rather than only beside the invest button: a
                    disabled button with no visible budget reads as a broken control,
                    and the player has no way to learn the money is annual. */}
                <header className="province-map-head">
                    <span className="province-map-head-label">Development budget</span>
                    <strong className="province-map-head-value">{formatCurrency(budget)}</strong>
                    <span className="province-map-head-note">
                        {canInvest
                            ? `${Math.floor(budget / investmentStep)} allocation${Math.floor(budget / investmentStep) === 1 ? '' : 's'} left this year`
                            : 'Spent — provincial revenue funds the next allocation in the new year'}
                    </span>
                </header>
                <hr className="rule-double" />

                <svg
                    className="province-map-svg"
                    viewBox={`${VIEW_MIN} ${VIEW_MIN} ${VIEW_SIZE} ${VIEW_SIZE}`}
                    preserveAspectRatio="xMidYMid meet"
                    role="group"
                    aria-label={`Provincial development map — ${provinces.length} provinces`}
                >
                    <defs>
                        <pattern id={hatchLowId} width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                            <line x1="0" y1="0" x2="0" y2="6" stroke="#241505" strokeWidth="1.3" />
                        </pattern>
                        <pattern id={hatchHighId} width="3" height="3" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                            <line x1="0" y1="0" x2="0" y2="3" stroke="#3a0c0c" strokeWidth="1.5" />
                        </pattern>

                        {/* Concentric ripple lines over a faint verdigris wash — the engraved-
                            map convention for open water, kept inside the ink/paper/brass
                            family rather than reaching for an unrelated blue. */}
                        <pattern id={seaPatternId} width="12" height="8" patternUnits="userSpaceOnUse">
                            <rect width="12" height="8" fill="rgba(63, 107, 88, 0.16)" />
                            <path d="M0,2 Q3,0.2 6,2 T12,2" stroke="rgba(10, 11, 7, 0.42)" strokeWidth="0.4" fill="none" />
                            <path d="M0,5.6 Q3,3.8 6,5.6 T12,5.6" stroke="rgba(10, 11, 7, 0.36)" strokeWidth="0.4" fill="none" />
                        </pattern>

                        {TERRAIN_LIST.flatMap(terrain => {
                            const [tw, th] = TERRAIN_TILE[terrain];
                            return [
                                <pattern
                                    key={`${terrain}-ink`}
                                    id={terrainPatternId(terrain, 'ink')}
                                    width={tw}
                                    height={th}
                                    patternUnits="userSpaceOnUse"
                                >
                                    {terrainGlyph(terrain, 'rgba(24, 20, 11, 0.62)')}
                                </pattern>,
                                <pattern
                                    key={`${terrain}-cream`}
                                    id={terrainPatternId(terrain, 'cream')}
                                    width={tw}
                                    height={th}
                                    patternUnits="userSpaceOnUse"
                                >
                                    {terrainGlyph(terrain, 'rgba(248, 242, 226, 0.58)')}
                                </pattern>,
                            ];
                        })}

                        {/* Clip paths: one per province, so settlement and infrastructure
                            elements stay contained inside their polygon boundaries. */}
                        {provinces.map(province => (
                            <clipPath key={`clip-${province.id}`} id={provinceClipPathId(province.id)}>
                                <polygon points={province.shape} />
                            </clipPath>
                        ))}
                    </defs>

                    {/* Hydrography and the land frontier sit behind every province and are
                        derived, not authored — see frontierEdges. Both are decorative: they
                        never intercept a click, and they carry no information a province's
                        own fill, hatch or label doesn't already state. */}
                    <g className="pm-hydrography" aria-hidden="true" pointerEvents="none">
                        {coastEdges.map((edge, i) => (
                            <polygon key={`sea-${i}`} className="pm-sea" points={seaQuad(edge, center)} fill={`url(#${seaPatternId})`} />
                        ))}
                        {coastEdges.map((edge, i) => (
                            <line
                                key={`coast-${i}`}
                                className="pm-coastline"
                                x1={edge.p1[0]}
                                y1={edge.p1[1]}
                                x2={edge.p2[0]}
                                y2={edge.p2[1]}
                            />
                        ))}
                        {borderEdges.map((edge, i) => {
                            const line = borderLine(edge, center);
                            return <line key={`border-${i}`} className="pm-border-line" {...line} />;
                        })}
                    </g>

                    {orderedProvinces.map(province => {
                        const isSelected = province.id === selectedId;
                        const isHovered = province.id === hoveredId;
                        const isRestive = province.unrest > RESTIVE_FLOOR;
                        const isInvestedThisYear = province.lastInvestedYear === year;
                        const hatch = hatchOpacity(province.unrest);
                        const terrainTone = isDarkFill(province.development) ? 'cream' : 'ink';
                        const [labelTop, labelBottom] = splitLabel(province.name);
                        const label = `${province.name}, ${TERRAIN_LABELS[province.terrain]} province of the ${province.group}. `
                            + `Development ${Math.round(province.development)} of 100. `
                            + `Unrest ${unrestLabel(province.unrest)}, ${Math.round(province.unrest)} of 100.`
                            + (isSelected ? ' Selected.' : '');

                        return (
                            <g
                                key={province.id}
                                className={
                                    'province-group'
                                    + (isSelected ? ' is-selected' : '')
                                    + (isHovered ? ' is-hovered' : '')
                                    + (isRestive ? ' is-restive' : '')
                                }
                            >
                                <polygon
                                    className="province-shape"
                                    points={province.shape}
                                    style={{ fill: developmentColor(province.development) }}
                                    role="button"
                                    tabIndex={0}
                                    aria-pressed={isSelected}
                                    aria-label={label}
                                    onClick={() => toggleSelection(province.id)}
                                    onKeyDown={event => handleKeyDown(event, province.id)}
                                    onMouseEnter={() => setHoveredId(province.id)}
                                    onMouseLeave={() => setHoveredId(current => (current === province.id ? null : current))}
                                    onFocus={() => {
                                        setHoveredId(province.id);
                                        setFocusedId(province.id);
                                    }}
                                    onBlur={() => {
                                        setHoveredId(current => (current === province.id ? null : current));
                                        setFocusedId(current => (current === province.id ? null : current));
                                    }}
                                />

                                {/* The terrain field rendered as texture, not colour, so it never
                                    competes with the development ramp for the same visual channel. */}
                                <polygon
                                    className="province-terrain"
                                    points={province.shape}
                                    fill={`url(#${terrainPatternId(province.terrain, terrainTone)})`}
                                    aria-hidden="true"
                                    pointerEvents="none"
                                />

                                {hatch > 0 && (
                                    <polygon
                                        className="province-hatch"
                                        points={province.shape}
                                        fill={`url(#${isRestive ? hatchHighId : hatchLowId})`}
                                        opacity={hatch}
                                        aria-hidden="true"
                                        pointerEvents="none"
                                    />
                                )}

                                {isRestive && (
                                    <polygon
                                        className="province-restive-edge"
                                        points={province.shape}
                                        aria-hidden="true"
                                        pointerEvents="none"
                                    />
                                )}

                                {/* Settlement buildings: small inked structures that grow with
                                    development. Clipped to the province boundary. Stroke color adapts to
                                    fill brightness: cream on dark fills, dark on light fills (matching terrain glyph logic). */}
                                {(() => {
                                    const buildingStroke = isDarkFill(province.development) ? 'rgba(248, 242, 226, 0.75)' : 'rgba(24, 20, 11, 0.85)';
                                    const roofStroke = isDarkFill(province.development) ? 'rgba(248, 242, 226, 0.6)' : 'rgba(24, 20, 11, 0.7)';
                                    return (
                                        <g clipPath={`url(#${provinceClipPathId(province.id)})`} aria-hidden="true" pointerEvents="none">
                                            {settlementBuildings(province.development, province.cx, province.cy).map((building, i) => (
                                                <g key={`building-${i}`} className="settlement-building">
                                                    <rect
                                                        x={building.x}
                                                        y={building.y}
                                                        width={building.width}
                                                        height={building.height}
                                                        fill="none"
                                                        stroke={buildingStroke}
                                                        strokeWidth={0.55}
                                                    />
                                                    {/* Small roof indicator on top */}
                                                    <line
                                                        x1={building.x - 0.1}
                                                        y1={building.y}
                                                        x2={building.x + building.width / 2}
                                                        y2={building.y - 1.2}
                                                        stroke={roofStroke}
                                                        strokeWidth={0.4}
                                                    />
                                                    <line
                                                        x1={building.x + building.width / 2}
                                                        y1={building.y - 1.2}
                                                        x2={building.x + building.width + 0.1}
                                                        y2={building.y}
                                                        stroke={roofStroke}
                                                        strokeWidth={0.4}
                                                    />
                                                </g>
                                            ))}
                                        </g>
                                    );
                                })()}

                                    {/* Infrastructure: roads, rails, ports, mines, fields. Stroke color adapts to
                                        fill brightness like the buildings: cream on dark, dark on light. */}
                                    {(() => {
                                        const infraStroke = isDarkFill(province.development) ? 'rgba(248, 242, 226, 0.8)' : 'rgba(24, 20, 11, 0.8)';
                                        return infrastructureElements(province).map((infra, i) => (
                                            <g
                                                key={`infra-${i}`}
                                                className={`infrastructure-${infra.type}`}
                                                stroke={infraStroke}
                                                strokeWidth={infra.strokeWidth ? infra.strokeWidth * 1.4 : 0.7}
                                                fill="none"
                                                strokeLinecap="round"
                                            >
                                                {infra.type === 'rail' ? (
                                                    // Dashed line for rails
                                                    infra.paths.map((p, j) => (
                                                        <path
                                                            key={`rail-${j}`}
                                                            d={p}
                                                            strokeDasharray="2.1 1.4"
                                                            strokeWidth={0.7}
                                                        />
                                                    ))
                                                ) : (
                                                    // Regular paths for other infrastructure
                                                    infra.paths.map((p, j) => (
                                                        <path key={`path-${j}`} d={p} />
                                                    ))
                                                )}
                                            </g>
                                        ));
                                    })()}

                                {isInvestedThisYear && (
                                    <circle
                                        key={`ring-${province.id}-${province.lastInvestedYear}`}
                                        className="province-invest-ring"
                                        cx={province.cx}
                                        cy={province.cy}
                                        r={6 * SCALE}
                                        aria-hidden="true"
                                        pointerEvents="none"
                                    />
                                )}

                                {/* Year-over-year delta indicator: small, quiet change badge. */}
                                {deltas && deltas[province.id] && (
                                    (() => {
                                        const delta = deltas[province.id];
                                        const deltaDev = Math.round(delta.development);
                                        // Only show if there was measurable change
                                        if (deltaDev !== 0) {
                                            const displayDelta = deltaDev > 0 ? `+${deltaDev}` : String(deltaDev);
                                            return (
                                                <text
                                                    className={`province-delta-indicator ${deltaDev > 0 ? 'is-positive' : 'is-negative'}`}
                                                    x={province.cx}
                                                    y={province.cy - 11}
                                                    textAnchor="middle"
                                                    aria-hidden="true"
                                                    pointerEvents="none"
                                                >
                                                    {displayDelta}
                                                </text>
                                            );
                                        }
                                        return null;
                                    })()
                                )}

                                {/* Last in the group so the name sits above the hatching, the
                                    restive edge, and the investment pulse. aria-hidden because
                                    the polygon's own aria-label already announces the name. */}
                                <text
                                    className="province-label"
                                    x={province.cx}
                                    y={province.cy}
                                    textAnchor="middle"
                                    aria-hidden="true"
                                    pointerEvents="none"
                                >
                                    <tspan x={province.cx} dy={labelBottom ? '-0.1em' : '0.34em'}>
                                        {labelTop}
                                    </tspan>
                                    {labelBottom && (
                                        <tspan x={province.cx} dy="1.05em">
                                            {labelBottom}
                                        </tspan>
                                    )}
                                </text>
                            </g>
                        );
                    })}

                    {focusRing && (
                        <polygon
                            className="province-focus-ring"
                            points={focusRing.shape}
                            aria-hidden="true"
                            pointerEvents="none"
                        />
                    )}

                    {/* Cartographic furniture: a plate border, a title cartouche, a compass
                        and a scale bar. All static, all aria-hidden, all pointer-events:none —
                        the sr-only list below and each province's own aria-label already carry
                        every fact a player needs. */}
                    <g className="pm-frame" aria-hidden="true" pointerEvents="none">
                        <rect
                            className="pm-neatline-misreg"
                            x={FRAME_MIN + 0.5}
                            y={FRAME_MIN + 0.4}
                            width={FRAME_SIZE}
                            height={FRAME_SIZE}
                        />
                        <rect className="pm-neatline-outer" x={FRAME_MIN} y={FRAME_MIN} width={FRAME_SIZE} height={FRAME_SIZE} />
                        <rect
                            className="pm-neatline-inner"
                            x={FRAME_MIN + 1.6}
                            y={FRAME_MIN + 1.6}
                            width={FRAME_SIZE - 3.2}
                            height={FRAME_SIZE - 3.2}
                        />
                        <CornerTick x={FRAME_MIN} y={FRAME_MIN} />
                        <CornerTick x={FRAME_MAX} y={FRAME_MIN} />
                        <CornerTick x={FRAME_MAX} y={FRAME_MAX} />
                        <CornerTick x={FRAME_MIN} y={FRAME_MAX} />
                    </g>

                    <g className="pm-cartouche" aria-hidden="true" pointerEvents="none">
                        <rect x={20} y={-12.5} width={60} height={9.5} rx={0.6} />
                        <text className="pm-cartouche-title" x={50} y={-8.3} textAnchor="middle">
                            Ministry of Development
                        </text>
                        <text className="pm-cartouche-sub" x={50} y={-4.4} textAnchor="middle">
                            Provincial Survey — {year}
                        </text>
                    </g>

                    <g className="pm-compass" aria-hidden="true" pointerEvents="none" transform="translate(97, -5)">
                        <circle className="pm-compass-plate" r={7} />
                        <circle className="pm-compass-ring" r={4.8} />
                        <path className="pm-compass-needle-dark" d="M0,-4.8 L1.4,0 L0,4.8 Z" />
                        <path className="pm-compass-needle-light" d="M0,-4.8 L-1.4,0 L0,4.8 Z" />
                        <path className="pm-compass-needle-cross" d="M-4.8,0 L0,-1 L4.8,0 L0,1 Z" />
                        <text className="pm-compass-label" x={0} y={-6} textAnchor="middle">N</text>
                    </g>

                    <g className="pm-scale" aria-hidden="true" pointerEvents="none" transform="translate(-10.5, 100)">
                        <rect className="pm-scale-plate" x={-1.4} y={-2} width={19} height={11} rx={0.5} />
                        {[0, 1, 2, 3].map(i => (
                            <rect
                                key={i}
                                className={`pm-scale-seg${i % 2 === 0 ? ' is-fill' : ''}`}
                                x={i * 3.5}
                                y={2.2}
                                width={3.5}
                                height={1.4}
                            />
                        ))}
                        <text className="pm-scale-label" x={7} y={8.4} textAnchor="middle">Approx. scale</text>
                    </g>
                </svg>

                <div className="province-map-legend" aria-hidden="true">
                    <div className="legend-ramp">
                        <span>Underdeveloped</span>
                        <i className="legend-ramp-bar" />
                        <span>Prosperous</span>
                    </div>
                    <div className="legend-unrest">
                        {/* Drawn directly rather than sampling the map's own hatch pattern: at
                            this display size a tiled pattern's repeat is too fine to read, so
                            the swatch uses a few large strokes to stay legible instead. */}
                        <svg className="legend-hatch-swatch" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                            <rect width="20" height="20" rx="3" fill="#241505" />
                            <path d="M-2,5 L7,-2 M-2,13 L15,-4 M2,22 L23,1 M10,22 L23,9" stroke="#c25b5b" strokeWidth="2.6" />
                            <rect width="20" height="20" rx="3" fill="none" stroke="rgba(229, 115, 115, 0.5)" strokeWidth="1" />
                        </svg>
                        <span>Hatching marks unrest from Uneasy; Restive provinces pulse red</span>
                    </div>
                </div>

                {/* SVG shapes plus aria-labels carry the interactive map, but this list
                    restates the same facts as plain text for assistive tech that struggles
                    with SVG geometry. */}
                <ul className="province-map-fallback sr-only">
                    {provinces.map(province => (
                        <li key={province.id}>
                            {province.name} — {province.group}, {TERRAIN_LABELS[province.terrain]}
                            {province.coastal ? ', coastal' : ''}. Development {Math.round(province.development)} of 100.
                            {' '}Unrest {unrestLabel(province.unrest)} ({Math.round(province.unrest)} of 100).
                            {' '}Minerals {Math.round(province.minerals)}, farmland {Math.round(province.farmland)}.
                            {' '}Invested {formatCurrency(province.invested)} to date.
                            {province.id === selectedId ? ' Currently selected.' : ''}
                        </li>
                    ))}
                </ul>
            </div>

            <aside className="province-detail mat-paper mat-grain anim-rise" aria-live="polite">
                {selected ? (
                    <>
                        <span className="province-detail-eyebrow">{TERRAIN_LABELS[selected.terrain]} · {selected.group}</span>
                        <h3 className="province-detail-name">{selected.name}</h3>
                        <p className="province-detail-blurb">{selected.blurb}</p>

                        <dl className="province-detail-stats">
                            <div>
                                <dt>Development</dt>
                                <dd>
                                    <span className="province-stat-track">
                                        <i style={{ width: `${clamp(selected.development, 0, 100)}%` }} />
                                    </span>
                                    <span className="province-stat-value">{Math.round(selected.development)} / 100</span>
                                </dd>
                                {deltas && deltas[selected.id] && (
                                    <div className="province-stat-delta">
                                        <span className={deltas[selected.id].development !== 0 ? 'has-change' : ''}>
                                            {deltas[selected.id].development !== 0
                                                ? `${Math.round(selected.development - deltas[selected.id].development)} → ${Math.round(selected.development)}  (${deltas[selected.id].development > 0 ? '+' : ''}${Math.round(deltas[selected.id].development)} since ${year - 1})`
                                                : `No change since ${year - 1}`}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <dt>Unrest</dt>
                                <dd>
                                    <span className="province-stat-track is-unrest">
                                        <i style={{ width: `${clamp(selected.unrest, 0, 100)}%` }} />
                                    </span>
                                    <span className="province-stat-value">{unrestLabel(selected.unrest)} · {Math.round(selected.unrest)} / 100</span>
                                </dd>
                                {deltas && deltas[selected.id] && (
                                    <div className="province-stat-delta">
                                        <span className={deltas[selected.id].unrest !== 0 ? 'has-change' : ''}>
                                            {deltas[selected.id].unrest !== 0
                                                ? `${Math.round(selected.unrest - deltas[selected.id].unrest)} → ${Math.round(selected.unrest)}  (${deltas[selected.id].unrest > 0 ? '+' : ''}${Math.round(deltas[selected.id].unrest)} since ${year - 1})`
                                                : `No change since ${year - 1}`}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {deltas && deltas[selected.id] && deltas[selected.id].minerals !== 0 && (
                                <div>
                                    <dt>Minerals</dt>
                                    <dd>
                                        <span className="province-stat-delta">
                                            {Math.round(selected.minerals - deltas[selected.id].minerals)} → {Math.round(selected.minerals)}  ({deltas[selected.id].minerals > 0 ? '+' : ''}{Math.round(deltas[selected.id].minerals)} since {year - 1})
                                        </span>
                                    </dd>
                                </div>
                            )}
                        </dl>

                        <div className="province-detail-tags">
                            <span>Minerals {Math.round(selected.minerals)}</span>
                            <span>Farmland {Math.round(selected.farmland)}</span>
                            {selected.coastal && <span>Coastal</span>}
                        </div>

                        <p className="province-detail-invested">
                            Cumulative investment <strong>{formatCurrency(selected.invested)}</strong>
                        </p>

                        <h4 className="province-programmes-title">Spend an allocation on</h4>
                        <ul className="province-programmes">
                            {PROGRAMMES.map(programme => {
                                const built = selected.works?.[programme.id] ?? 0;
                                const endowmentBlock = programmeBlockedReason(programme, selected);
                                const licenceBlock = programme.id === 'extraction' && !canLicenceMore(selected)
                                    ? `All ${LICENCE_CAP} concessions here are already chartered.`
                                    : null;
                                const blocked = endowmentBlock ?? licenceBlock;
                                const affordable = budget >= programme.cost;

                                return (
                                    <li key={programme.id} className={`province-programme${blocked ? ' is-blocked' : ''}`}>
                                        <button
                                            type="button"
                                            className="province-programme-button"
                                            disabled={Boolean(blocked) || !affordable}
                                            onClick={() => onBuild(selected.id, programme.id, programme.cost)}
                                        >
                                            <span className="province-programme-head">
                                                <span className="province-programme-name">{programme.name}</span>
                                                <span className="province-programme-cost">
                                                    {formatCurrency(programme.cost)}
                                                </span>
                                            </span>
                                            <span className="province-programme-blurb">{programme.blurb}</span>
                                            {/* Qualitative, like every other forecast in this game —
                                                the numbers show up in what the province does next. */}
                                            <span className="province-programme-forecast">{programme.forecast}</span>
                                        </button>

                                        {built > 0 && (
                                            <span className="province-programme-built">
                                                Built here {built}
                                                {programme.id === 'extraction' ? ` of ${LICENCE_CAP}` : ''}
                                            </span>
                                        )}
                                        {blocked && <span className="province-programme-blocked">{blocked}</span>}
                                    </li>
                                );
                            })}
                        </ul>

                        {!canInvest && (
                            <p className="province-detail-hint">
                                This year&rsquo;s development budget is spent. The provinces pay into
                                the treasury as they grow, and a share returns as next year&rsquo;s
                                allocation.
                            </p>
                        )}
                    </>
                ) : (
                    <p className="province-detail-empty">Select a province on the map to review its development, unrest, and endowments.</p>
                )}
            </aside>
        </section>
    );
}
