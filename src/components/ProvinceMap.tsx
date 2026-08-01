import { useId, useState } from 'react';
import type { JSX, KeyboardEvent } from 'react';
import type { Province, Terrain } from '../engine/types';
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
    onInvest: (provinceId: string) => void;
}

/* --- development ramp: deep ink -> antique gold -> pale cream --- */

type Rgb = readonly [number, number, number];

const RAMP_INK: Rgb = [26, 23, 15];
const RAMP_GOLD: Rgb = [212, 175, 55];
const RAMP_CREAM: Rgb = [246, 236, 201];

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
    onInvest,
}: ProvinceMapProps): JSX.Element {
    const uid = useId();
    const hatchLowId = `pm-hatch-low-${uid}`;
    const hatchHighId = `pm-hatch-high-${uid}`;
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [focusedId, setFocusedId] = useState<string | null>(null);

    const selected = provinces.find(province => province.id === selectedId) ?? null;
    const canInvest = budget >= investmentStep;

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
            <div className="province-map-wrap">
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

                <svg
                    className="province-map-svg"
                    viewBox="0 0 100 100"
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
                    </defs>

                    {orderedProvinces.map(province => {
                        const isSelected = province.id === selectedId;
                        const isHovered = province.id === hoveredId;
                        const isRestive = province.unrest > RESTIVE_FLOOR;
                        const isInvestedThisYear = province.lastInvestedYear === year;
                        const hatch = hatchOpacity(province.unrest);
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

                                {isInvestedThisYear && (
                                    <circle
                                        key={`ring-${province.id}-${province.lastInvestedYear}`}
                                        className="province-invest-ring"
                                        cx={province.cx}
                                        cy={province.cy}
                                        r="6"
                                        aria-hidden="true"
                                        pointerEvents="none"
                                    />
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

            <aside className="province-detail" aria-live="polite">
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
                            </div>
                            <div>
                                <dt>Unrest</dt>
                                <dd>
                                    <span className="province-stat-track is-unrest">
                                        <i style={{ width: `${clamp(selected.unrest, 0, 100)}%` }} />
                                    </span>
                                    <span className="province-stat-value">{unrestLabel(selected.unrest)} · {Math.round(selected.unrest)} / 100</span>
                                </dd>
                            </div>
                        </dl>

                        <div className="province-detail-tags">
                            <span>Minerals {Math.round(selected.minerals)}</span>
                            <span>Farmland {Math.round(selected.farmland)}</span>
                            {selected.coastal && <span>Coastal</span>}
                        </div>

                        <p className="province-detail-invested">
                            Cumulative investment <strong>{formatCurrency(selected.invested)}</strong>
                        </p>

                        <button
                            type="button"
                            className="province-invest-button"
                            disabled={!canInvest}
                            onClick={() => onInvest(selected.id)}
                        >
                            Invest ({formatCurrency(investmentStep)})
                        </button>

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
