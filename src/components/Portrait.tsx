import { useId } from 'react';
import type { ReactNode } from 'react';
import type { CharacterId } from '../engine/types';
import { CHARACTERS_BY_ID } from '../data/characters';
import './Portrait.css';

interface PortraitProps {
    characterId: CharacterId;
    size?: number;
}

/** Fine gold cross-hatch over the shoulders, the engraving's shading. */
const HATCH = (
    <g stroke="var(--color-primary)" strokeOpacity="0.22" strokeWidth="0.9" strokeLinecap="round">
        <path d="M24 70 L32 66" />
        <path d="M26 78 L34 74" />
        <path d="M28 86 L36 82" />
        <path d="M76 70 L68 66" />
        <path d="M74 78 L66 74" />
        <path d="M72 86 L64 82" />
    </g>
);

/**
 * One signature attribute per character, drawn over the shared bust so each
 * silhouette is recognizable by outline alone at 40px: collar-and-tie,
 * peaked cap, wrapped headscarf, broad-brimmed hat.
 */
const ATTRIBUTES: Record<CharacterId, ReactNode> = {
    finance_minister: (
        <>
            {/* shirt collar */}
            <path d="M50 48 L39 57 L46 63 L50 55 L54 63 L61 57 Z" fill="#e6d9ae" />
            {/* necktie */}
            <path d="M46.5 58 L53.5 58 L51.5 90 L48.5 90 Z" fill="var(--color-primary)" />
        </>
    ),
    army_chief: (
        <>
            <path d="M33 34 Q33 15 50 15 Q67 15 67 34 Z" fill="#241f18" />
            <path d="M31 32 h38 v4 h-38 Z" fill="var(--color-primary)" />
            <path d="M35 36 Q50 43 65 36 L65 39.5 Q50 46 35 39.5 Z" fill="#241f18" />
            <circle cx="50" cy="24" r="2.1" fill="var(--color-primary)" />
            <g stroke="var(--color-primary)" strokeWidth="1" fill="none">
                <rect x="23" y="55" width="11" height="4" rx="0.6" />
                <rect x="66" y="55" width="11" height="4" rx="0.6" />
            </g>
        </>
    ),
    labor_leader: (
        <>
            <path d="M31 36 Q33 13 50 11 Q67 13 69 36 Q69 45 50 47 Q31 45 31 36 Z" fill="#e6d9ae" />
            <path d="M34 29 Q50 25 66 29" fill="none" stroke="#241f18" strokeOpacity="0.45" strokeWidth="1" />
            <path d="M35 21 Q50 17 65 21" fill="none" stroke="#241f18" strokeOpacity="0.45" strokeWidth="1" />
            <path d="M59 13 L68 8 L64 19 Z" fill="var(--color-primary)" />
        </>
    ),
    provincial_chair: (
        <>
            <ellipse cx="50" cy="35" rx="31" ry="6.5" fill="#241f18" />
            <path d="M38 35 Q38 18 50 18 Q62 18 62 35 Z" fill="#3a352b" />
            <path d="M38 32.5 h24 v3 h-24 Z" fill="var(--color-primary)" />
        </>
    ),
};

/**
 * An engraved-style bust for one of the four cabinet characters. Purely
 * inline SVG so it can replace the initials-in-a-circle `.proposal-avatar`
 * treatment without any network or build-time asset.
 */
export function Portrait({ characterId, size = 40 }: PortraitProps) {
    const character = CHARACTERS_BY_ID[characterId];
    const label = `${character.name}, ${character.title}`;
    const uid = useId();
    const gradientId = `${uid}-grad`;
    const shimmerId = `${uid}-shimmer`;
    const clipId = `${uid}-clip`;
    // The idle shimmer is a large-size flourish only; see Portrait.css for
    // how prefers-reduced-motion turns it off entirely.
    const isLarge = size >= 64;

    return (
        <svg
            className={`portrait${isLarge ? ' portrait--large' : ''}`}
            width={size}
            height={size}
            viewBox="0 0 100 100"
            role="img"
            aria-label={label}
        >
            <title>{label}</title>
            <defs>
                <radialGradient id={gradientId} cx="35%" cy="28%" r="75%">
                    <stop offset="0%" stopColor="#4e4a3c" />
                    <stop offset="100%" stopColor="#1c1912" />
                </radialGradient>
                <radialGradient id={shimmerId} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fff6da" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#fff6da" stopOpacity="0" />
                </radialGradient>
                <clipPath id={clipId}>
                    <circle cx="50" cy="50" r="45" />
                </clipPath>
            </defs>

            <circle cx="50" cy="50" r="48" fill={`url(#${gradientId})`} />

            <g clipPath={`url(#${clipId})`}>
                <path d="M17 92 Q19 60 36 54 Q50 49 64 54 Q81 60 83 92 Z" fill="#221d17" />
                <circle cx="50" cy="38" r="14" fill="#221d17" />
                {HATCH}
                {ATTRIBUTES[characterId]}
                <ellipse
                    className="portrait-shimmer"
                    cx="35"
                    cy="28"
                    rx="20"
                    ry="13"
                    fill={`url(#${shimmerId})`}
                />
            </g>

            <circle cx="50" cy="50" r="48" fill="none" stroke="var(--color-primary)" strokeWidth="2.4" />
            <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="var(--color-primary)"
                strokeOpacity="0.3"
                strokeWidth="1.1"
            />
        </svg>
    );
}
