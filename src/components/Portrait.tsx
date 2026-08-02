import { useId } from 'react';
import type { ReactNode } from 'react';
import type { CharacterId } from '../engine/types';
import { CHARACTERS_BY_ID } from '../data/characters';
import './Portrait.css';

interface PortraitProps {
    characterId: CharacterId;
    size?: number;
}

/**
 * Engraved plate portraits of the four ministers — struck like a medallion or
 * a screen-printed dossier photograph rather than a flat icon.
 *
 * These render from 22px in the faction rail up to 96px in test harnesses, so
 * legibility at the smallest size drives every decision here. Below
 * DETAIL_THRESHOLD every hatch line, engraving tick and shading crescent is
 * dropped — at 22px it is noise, not texture — and the four characters are
 * separated purely by silhouette: peaked cap, headwrap, broad brim, bare head
 * over a collar. Above the threshold the same busts gain cross-hatched
 * shading, a brass bezel and a coin-edge ring so they read as engraved plates
 * once there is room to show it.
 */

/** Below this, fine detail is dropped: at 22px it is noise, not texture. */
const DETAIL_THRESHOLD = 34;
/** Only plates rendered this large or bigger get the ambient foil glint. */
const LARGE_THRESHOLD = 48;
/** Coin-edge reeding around the bezel, drawn only when detailed. */
const TICK_COUNT = 40;
const TICKS = Array.from({ length: TICK_COUNT }, (_, i) => {
    const angle = (i / TICK_COUNT) * Math.PI * 2;
    const rOuter = 48.6;
    const rInner = 45.4;
    return {
        x1: 50 + rOuter * Math.cos(angle),
        y1: 50 + rOuter * Math.sin(angle),
        x2: 50 + rInner * Math.cos(angle),
        y2: 50 + rInner * Math.sin(angle),
    };
});

const GOLD = 'var(--color-primary)';
const CREAM = 'var(--paper-200)';
const INK = 'var(--ink-600)';
const INK_DEEP = 'var(--ink-900)';

/** A shared brow/nose/mouth hint — the same four lines on the same bust shape
 *  for every character, so a single etched touch makes all of them read as a
 *  face rather than a mannequin once there is room to show it. */
const FACE_LINES = (
    <g stroke={INK_DEEP} strokeOpacity="0.5" strokeWidth="0.9" fill="none" strokeLinecap="round">
        <path d="M42.5 35.5 Q45.5 34 48.5 35.5" />
        <path d="M47 40 Q50.5 44 48.5 48" />
        <path d="M44 53 Q49 55.5 54.5 53" />
    </g>
);

/** The same crescent of jaw shadow suits every character: the bust ellipse is
 *  identical across all four, only what sits above it changes. */
const jawShade = (hatchId: string): ReactNode => (
    <path d="M60 47 Q69 55 63 67 Q54 60 57 49 Z" fill={`url(#${hatchId})`} opacity="0.4" />
);

interface Look {
    /** Bust fill, kept light so the silhouette reads against the dark ground. */
    skin: string;
    /** Shoulders, drawn under the head covering. */
    collar: ReactNode;
    /** Head covering — the part that carries recognition. */
    head: (detailed: boolean) => ReactNode;
    /** Cross-hatched engraving texture, dropped below DETAIL_THRESHOLD. */
    shade: (hatchId: string, crossId: string) => ReactNode;
}

const LOOKS: Record<CharacterId, Look> = {
    // Peaked service cap. A hard horizontal brim is the most distinctive
    // outline in the set and stays readable as "army" at any size.
    army_chief: {
        skin: '#c9b183',
        collar: (
            <>
                <path d="M16 100 Q20 78 50 73 Q80 78 84 100 Z" fill="var(--ink-300)" />
                <path d="M40 75 L50 92 L60 75 L56 72 L50 84 L44 72 Z" fill={CREAM} />
            </>
        ),
        head: detailed => (
            <>
                <path d="M24 40 Q24 12 50 12 Q76 12 76 40 L76 42 L24 42 Z" fill={INK} />
                <rect x="24" y="32" width="52" height="7" fill={GOLD} opacity="0.92" />
                <rect x="15" y="40" width="70" height="9" rx="3" fill="#0f1109" />
                {detailed && <circle cx="50" cy="24" r="5" fill={GOLD} />}
            </>
        ),
        shade: (_hatchId, crossId) => (
            <>
                <path d="M24 40 Q24 12 50 12 Q76 12 76 40 L76 42 L24 42 Z" fill={`url(#${crossId})`} opacity="0.3" />
                {FACE_LINES}
            </>
        ),
    },

    // Wrapped headscarf: a tall rounded mass, noticeably wider than the head,
    // in gold so it is the brightest silhouette of the four.
    labor_leader: {
        skin: '#ab7c52',
        collar: <path d="M14 100 Q18 78 50 73 Q82 78 86 100 Z" fill="var(--oxblood-dim)" />,
        head: detailed => (
            <>
                <path d="M17 44 Q13 7 50 5 Q87 7 83 44 Q83 53 50 55 Q17 53 17 44 Z" fill={GOLD} />
                {detailed && (
                    <>
                        <path d="M21 26 Q50 17 79 26" fill="none" stroke={INK} strokeOpacity="0.45" strokeWidth="2.4" />
                        <path d="M19 36 Q50 27 81 36" fill="none" stroke={INK} strokeOpacity="0.45" strokeWidth="2.4" />
                    </>
                )}
                <path d="M75 11 L95 3 L86 25 Z" fill={GOLD} />
            </>
        ),
        shade: hatchId => (
            <>
                <path
                    d="M17 44 Q13 7 50 5 Q87 7 83 44 Q83 53 50 55 Q17 53 17 44 Z"
                    fill={`url(#${hatchId})`}
                    opacity="0.28"
                />
                {FACE_LINES}
            </>
        ),
    },

    // Broad-brimmed hat: the widest outline in the set, unmistakable next to
    // the cap because the brim runs the full width of the frame.
    provincial_chair: {
        // Straw rather than ink: at 22px a dark hat with a gold band was too
        // close to the army cap, so the whole hat carries a light value and the
        // band goes dark, inverting the army silhouette instead of echoing it.
        skin: '#b98a5c',
        collar: <path d="M16 100 Q20 80 50 75 Q80 80 84 100 Z" fill="var(--ink-200)" />,
        head: detailed => (
            <>
                <path d="M31 37 Q31 13 50 13 Q69 13 69 37 Z" fill="#c9a765" />
                <rect x="31" y="29" width="38" height="7" fill="#3a2f1c" />
                <ellipse cx="50" cy="39" rx="47" ry="10" fill="#c9a765" />
                {/* The shadow a wide brim actually casts on the face beneath it —
                    a flat tint rather than a pattern, so it holds up at 22px too. */}
                <path d="M30 48 Q50 55 70 48 L69 54 Q50 61 31 54 Z" fill={INK_DEEP} opacity="0.24" />
                {detailed && (
                    <ellipse cx="50" cy="39" rx="47" ry="10" fill="none" stroke="#3a2f1c" strokeOpacity="0.6" strokeWidth="1.8" />
                )}
            </>
        ),
        shade: hatchId => (
            <>
                <ellipse cx="50" cy="39" rx="46" ry="9.4" fill={`url(#${hatchId})`} opacity="0.3" />
                {FACE_LINES}
            </>
        ),
    },

    // No headwear at all. The bare crown over a pale collar and gold tie is
    // itself the distinguishing feature, and the only light-topped silhouette.
    finance_minister: {
        skin: '#dcc094',
        collar: (
            <>
                <path d="M14 100 Q18 76 50 71 Q82 76 86 100 Z" fill="var(--ink-400)" />
                <path d="M33 75 Q50 97 67 75 L60 71 Q50 87 40 71 Z" fill={CREAM} />
                <path d="M45 79 L55 79 L53 100 L47 100 Z" fill={GOLD} />
            </>
        ),
        head: detailed => (
            <>
                <path d="M27 40 Q27 11 50 11 Q73 11 73 40 Q73 45 50 46 Q27 45 27 40 Z" fill="#2b2119" />
                {detailed && (
                    <path d="M31 26 Q50 16 69 26" fill="none" stroke={GOLD} strokeOpacity="0.5" strokeWidth="2.2" />
                )}
            </>
        ),
        shade: (_hatchId, crossId) => (
            <>
                <path
                    d="M27 40 Q27 11 50 11 Q73 11 73 40 Q73 45 50 46 Q27 45 27 40 Z"
                    fill={`url(#${crossId})`}
                    opacity="0.4"
                />
                {FACE_LINES}
            </>
        ),
    },
};

export function Portrait({ characterId, size = 40 }: PortraitProps) {
    const uid = useId();
    const clipId = `portrait-clip-${uid}`;
    const hatchId = `portrait-hatch-${uid}`;
    const crossId = `portrait-cross-${uid}`;
    const bezelId = `portrait-bezel-${uid}`;
    const fieldId = `portrait-field-${uid}`;
    const shimmerId = `portrait-shimmer-${uid}`;

    const character = CHARACTERS_BY_ID[characterId];
    const look = LOOKS[characterId];
    const detailed = size >= DETAIL_THRESHOLD;
    const large = size >= LARGE_THRESHOLD;

    return (
        <svg
            className={`portrait${large ? ' portrait--large' : ''}`}
            width={size}
            height={size}
            viewBox="0 0 100 100"
            role="img"
            aria-label={`${character.name}, ${character.title}`}
        >
            <title>{`${character.name}, ${character.title}`}</title>

            <defs>
                <clipPath id={clipId}>
                    <circle cx="50" cy="50" r="47" />
                </clipPath>

                <radialGradient id={fieldId} cx="46%" cy="36%" r="72%">
                    <stop offset="0%" stopColor={INK} />
                    <stop offset="100%" stopColor={INK_DEEP} />
                </radialGradient>

                <linearGradient id={bezelId} x1="18%" y1="0%" x2="86%" y2="100%">
                    <stop offset="0%" stopColor="var(--brass-500)" />
                    <stop offset="42%" stopColor="var(--brass-200)" />
                    <stop offset="55%" stopColor="var(--brass-100)" />
                    <stop offset="100%" stopColor="var(--brass-500)" />
                </linearGradient>

                {/* Engraving-line fills: dropped entirely below DETAIL_THRESHOLD so
                    there is nothing fine to smear into noise at 22px. */}
                {detailed && (
                    <>
                        <pattern id={hatchId} width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
                            <line x1="0" y1="0" x2="0" y2="3.2" stroke={INK_DEEP} strokeOpacity="0.6" strokeWidth="0.85" />
                        </pattern>
                        <pattern id={crossId} width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
                            <line x1="0" y1="0" x2="0" y2="3.2" stroke={INK_DEEP} strokeOpacity="0.65" strokeWidth="0.85" />
                            <line x1="0" y1="0" x2="3.2" y2="0" stroke={INK_DEEP} strokeOpacity="0.65" strokeWidth="0.85" />
                        </pattern>
                    </>
                )}

                {large && (
                    <linearGradient id={shimmerId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={CREAM} stopOpacity="0" />
                        <stop offset="50%" stopColor={CREAM} stopOpacity="0.55" />
                        <stop offset="100%" stopColor={CREAM} stopOpacity="0" />
                    </linearGradient>
                )}
            </defs>

            <circle cx="50" cy="50" r="47" fill={`url(#${fieldId})`} />

            <g clipPath={`url(#${clipId})`}>
                {/* Neck and head, scaled so the bust crops at the frame edge. */}
                <path d="M43 56 h14 v20 h-14 Z" fill={look.skin} />
                <ellipse cx="50" cy="40" rx="22" ry="25" fill={look.skin} />
                {look.collar}
                {look.head(detailed)}
                {detailed && jawShade(hatchId)}
                {detailed && look.shade(hatchId, crossId)}
            </g>

            {large && (
                <g className="portrait-shimmer" clipPath={`url(#${clipId})`}>
                    <rect x="-30" y="34" width="160" height="16" transform="rotate(-24 50 50)" fill={`url(#${shimmerId})`} />
                </g>
            )}

            {/* Brass bezel: a gradient band standing in for tarnished metal, a
                reeded coin edge struck across it, and a hairline groove separating
                the band from the printed field it frames. */}
            <circle cx="50" cy="50" r="47" fill="none" stroke={`url(#${bezelId})`} strokeWidth="3.6" />
            {detailed && (
                <g stroke={INK_DEEP} strokeOpacity="0.45" strokeWidth="0.55">
                    {TICKS.map((tick, index) => (
                        <line key={index} x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} />
                    ))}
                </g>
            )}
            <circle cx="50" cy="50" r="45.3" fill="none" stroke={INK_DEEP} strokeOpacity="0.55" strokeWidth="1" />
            <circle cx="50" cy="50" r="48.7" fill="none" stroke={CREAM} strokeOpacity="0.22" strokeWidth="0.8" />
        </svg>
    );
}
