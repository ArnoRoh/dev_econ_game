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
 * Engraved-coin portraits of the four ministers.
 *
 * These render at 22px in the faction rail and 42px on proposal cards, so
 * legibility when small drives every decision here. The bust is cropped by the
 * frame like a coin rather than floating inside it, the head is light against a
 * dark ground so there is a hard edge, and the characters are separated by
 * *outline* — peaked cap, headwrap, broad brim, bare head over a collar —
 * rather than by facial detail, which disappears below about 30px.
 */

/** Below this, fine detail is dropped: at 22px it is noise, not texture. */
const DETAIL_THRESHOLD = 34;

const GOLD = 'var(--color-primary)';
const CREAM = '#e8dcb4';
const INK = '#1d2018';

interface Look {
    /** Bust fill, kept light so the silhouette reads against the dark ground. */
    skin: string;
    /** Shoulders, drawn under the head covering. */
    collar: ReactNode;
    /** Head covering — the part that carries recognition. */
    head: (detailed: boolean) => ReactNode;
}

const LOOKS: Record<CharacterId, Look> = {
    // Peaked service cap. A hard horizontal brim is the most distinctive
    // outline in the set and stays readable as "army" at any size.
    army_chief: {
        skin: '#c9b183',
        collar: (
            <>
                <path d="M16 100 Q20 78 50 73 Q80 78 84 100 Z" fill="#3d4030" />
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
    },

    // Wrapped headscarf: a tall rounded mass, noticeably wider than the head,
    // in gold so it is the brightest silhouette of the four.
    labor_leader: {
        skin: '#ab7c52',
        collar: <path d="M14 100 Q18 78 50 73 Q82 78 86 100 Z" fill="#7a3f38" />,
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
    },

    // Broad-brimmed hat: the widest outline in the set, unmistakable next to
    // the cap because the brim runs the full width of the frame.
    provincial_chair: {
        // Straw rather than ink: at 22px a dark hat with a gold band was too
        // close to the army cap, so the whole hat carries a light value and the
        // band goes dark, inverting the army silhouette instead of echoing it.
        skin: '#b98a5c',
        collar: <path d="M16 100 Q20 80 50 75 Q80 80 84 100 Z" fill="#4a4433" />,
        head: detailed => (
            <>
                <path d="M31 37 Q31 13 50 13 Q69 13 69 37 Z" fill="#c9a765" />
                <rect x="31" y="29" width="38" height="7" fill="#3a2f1c" />
                <ellipse cx="50" cy="39" rx="47" ry="10" fill="#c9a765" />
                {detailed && (
                    <ellipse cx="50" cy="39" rx="47" ry="10" fill="none" stroke="#3a2f1c" strokeOpacity="0.6" strokeWidth="1.8" />
                )}
            </>
        ),
    },

    // No headwear at all. The bare crown over a pale collar and gold tie is
    // itself the distinguishing feature, and the only light-topped silhouette.
    finance_minister: {
        skin: '#dcc094',
        collar: (
            <>
                <path d="M14 100 Q18 76 50 71 Q82 76 86 100 Z" fill="#2b2e26" />
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
    },
};

export function Portrait({ characterId, size = 40 }: PortraitProps) {
    const uid = useId();
    const clipId = `portrait-clip-${uid}`;
    const character = CHARACTERS_BY_ID[characterId];
    const look = LOOKS[characterId];
    const detailed = size >= DETAIL_THRESHOLD;

    return (
        <svg
            className="portrait"
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
            </defs>

            <circle cx="50" cy="50" r="47" fill="#12140e" />

            <g clipPath={`url(#${clipId})`}>
                {/* Neck and head, scaled so the bust crops at the frame edge. */}
                <path d="M43 56 h14 v20 h-14 Z" fill={look.skin} />
                <ellipse cx="50" cy="40" rx="22" ry="25" fill={look.skin} />
                {look.collar}
                {look.head(detailed)}
            </g>

            <circle cx="50" cy="50" r="47" fill="none" stroke={GOLD} strokeOpacity="0.65" strokeWidth="3.5" />
        </svg>
    );
}
