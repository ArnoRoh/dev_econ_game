import type { ReactNode } from 'react';
import './Emblem.css';

/** Subject areas a proposal can be tagged with, plus a catch-all fallback. */
export type EmblemKind =
    | 'agriculture'
    | 'industry'
    | 'finance'
    | 'labour'
    | 'military'
    | 'trade'
    | 'education'
    | 'health'
    | 'institutions'
    | 'resources'
    | 'environment'
    | 'infrastructure'
    | 'social'
    | 'generic';

interface EmblemProps {
    kind: EmblemKind;
    size?: number;
}

/**
 * Line-art glyphs in the same engraved register as Portrait: gold stroke,
 * mostly unfilled, simple enough to read at 16px. Paths inherit fill/stroke
 * from the root <svg> unless a glyph needs a small solid accent.
 */
const GLYPHS: Record<EmblemKind, ReactNode> = {
    agriculture: (
        // wheat sheaf: three tied stalks, each capped with a V-shaped grain head
        <>
            <path d="M6.5 21c0-5.2 2.2-9 5.5-9s5.5 3.8 5.5 9" />
            <path d="M12 12V3" />
            <path d="M12 4.5 9.8 6.7M12 4.5l2.2 2.2" />
            <path d="M8.2 13V6.5" />
            <path d="M8.2 7.3 6.4 9.1M8.2 7.3l1.8 1.8" />
            <path d="M15.8 13V6.5" />
            <path d="M15.8 7.3 17.6 9.1M15.8 7.3l-1.8 1.8" />
        </>
    ),
    industry: (
        // factory: sawtooth roof over a wall line, one chimney stack
        <>
            <path d="M3 21h18" />
            <path d="M5 21V13" />
            <path d="M19 21V13" />
            <path d="M5 13l3.5-3 3.5 3 3.5-3 3.5 3" />
            <path d="M8 6v3" />
        </>
    ),
    finance: (
        // balance scales
        <>
            <path d="M12 3v4" />
            <path d="M12 20v-3" />
            <path d="M7 20h10" />
            <path d="M4 7h16" />
            <path d="M4 7l-2.2 5a2.6 2.6 0 0 0 4.4 0L4 7Z" />
            <path d="M20 7l-2.2 5a2.6 2.6 0 0 0 4.4 0L20 7Z" />
        </>
    ),
    labour: (
        // cogwheel with a hammer laid across it
        <>
            <circle cx="9" cy="15" r="4" />
            <circle cx="9" cy="15" r="1.1" fill="currentColor" stroke="none" />
            <path d="M9 9.4V7.6M9 22.4v-1.8M3.4 15H1.6M16.4 15h-1.8M5.3 11.3 4 10M12.7 11.3 14 10M5.3 18.7 4 20M12.7 18.7 14 20" />
            <path d="M13 11l6-6" />
            <path d="M17.5 3.5l3 3-2.5 2.5-3-3z" />
        </>
    ),
    military: (
        // crossed sabres, hilt guards near the lower ends
        <>
            <path d="M4 20 20 4" />
            <path d="M4 20l3-1M4 20l1-3" />
            <circle cx="3.2" cy="20.8" r="0.9" fill="currentColor" stroke="none" />
            <path d="M20 20 4 4" />
            <path d="M20 20l-3-1M20 20l-1-3" />
            <circle cx="20.8" cy="20.8" r="0.9" fill="currentColor" stroke="none" />
        </>
    ),
    trade: (
        // ship: hull, mast, sail, waterline
        <>
            <path d="M3 16h18l-2.5 5h-13z" />
            <path d="M12 16V4" />
            <path d="M12 5l6 4h-6z" />
            <path d="M2 20q2-1.6 4 0t4 0 4 0 4 0 4 0" />
        </>
    ),
    education: (
        // open book
        <>
            <path d="M12 6c-2-1.6-5-2-8-1.4v13c3-.6 6-.2 8 1.4" />
            <path d="M12 6c2-1.6 5-2 8-1.4v13c-3-.6-6-.2-8 1.4" />
            <path d="M12 6v13" />
        </>
    ),
    health: (
        // medical cross in a roundel
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v8M8 12h8" />
        </>
    ),
    institutions: (
        // columned portico with a pediment
        <>
            <path d="M3 21h18" />
            <path d="M6 21V10M10 21V10M14 21V10M18 21V10" />
            <path d="M3 10 12 4l9 6" />
            <path d="M4 10h16" />
        </>
    ),
    resources: (
        // pickaxe over rock strata
        <>
            <path d="M4 17h16M4 20h16" />
            <path d="M7 4c3 .4 5 2.4 5.4 5.4" />
            <path d="M17.4 4c-3 .4-5 2.4-5.4 5.4" />
            <path d="M12 9.4 5 17" />
        </>
    ),
    environment: (
        // leaf with a center vein
        <>
            <path d="M5 19C5 10 11 4 20 4 20 13 14 19 5 19Z" />
            <path d="M6 18 15 9" />
        </>
    ),
    infrastructure: (
        // suspension bridge: two towers, deck, cable arch
        <>
            <path d="M2 18h20" />
            <path d="M6 18V9M18 18V9" />
            <path d="M2 12q10-8 20 0" />
            <path d="M10 14v4M14 14v4" />
        </>
    ),
    social: (
        // two overlapping figures
        <>
            <circle cx="9" cy="8" r="3" />
            <circle cx="16" cy="9.4" r="2.6" />
            <path d="M3.5 20c.4-4 3-6 5.5-6s5.1 2 5.5 6" />
            <path d="M13.7 20c.3-3 2-5.4 4-6.2" />
        </>
    ),
    generic: (
        // unfurled scroll, for a matter that fits no other seal
        <>
            <circle cx="5" cy="12" r="2.2" />
            <circle cx="19" cy="12" r="2.2" />
            <path d="M7 9h10M7 15h10" />
            <path d="M7 9v6M17 9v6" />
        </>
    ),
};

/** A small engraved-line glyph for a proposal's subject area. */
export function Emblem({ kind, size = 20 }: EmblemProps) {
    return (
        <svg
            className="emblem"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {GLYPHS[kind]}
        </svg>
    );
}

/** Tag vocabulary from src/data/events.ts, mapped onto an EmblemKind. */
const TAG_TO_EMBLEM: Record<string, EmblemKind> = {
    mining: 'resources',
    resource_curse: 'resources',
    industry: 'industry',
    trade: 'trade',
    statist: 'institutions',
    fdi: 'finance',
    labor: 'labour',
    unrest: 'social',
    agriculture: 'agriculture',
    inequality: 'social',
    rural: 'agriculture',
    food: 'agriculture',
    technology: 'industry',
    education: 'education',
    gender: 'social',
    social: 'social',
    debt: 'finance',
    finance: 'finance',
    crisis: 'generic',
    poverty: 'social',
    health: 'health',
    war: 'military',
    infrastructure: 'infrastructure',
    energy: 'infrastructure',
    environment: 'environment',
    aid: 'social',
    institutions: 'institutions',
    macro: 'finance',
    corruption: 'institutions',
    military: 'military',
    geopolitics: 'generic',
    culture: 'social',
    politics: 'institutions',
    crime: 'institutions',
    budget: 'finance',
};

/**
 * First tag with a known mapping wins, so authored tag order (primary tag
 * first) picks the emblem. Falls back to `generic` when nothing matches.
 */
// eslint-disable-next-line react-refresh/only-export-components -- pure data helper colocated with the Emblem it serves
export function emblemForTags(tags: string[]): EmblemKind {
    for (const tag of tags) {
        const mapped = TAG_TO_EMBLEM[tag];
        if (mapped) {
            return mapped;
        }
    }
    return 'generic';
}
