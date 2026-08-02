/**
 * Non-audio player preferences that need to exist before the first React
 * render (so applying them can't cause a flash of the un-preferred state) and
 * that more than one component needs to reach. See `src/audio/context.ts` for
 * the equivalent volume/mute persistence.
 */

const REDUCE_MOTION_KEY = 'dev_econ_reduce_motion';

/** The default before the player has ever touched the toggle: honour the OS-level preference. */
export function systemPrefersReducedMotion(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** null means "never set" — callers should fall back to `systemPrefersReducedMotion()`. */
export function readStoredReduceMotion(): boolean | null {
    try {
        const raw = localStorage.getItem(REDUCE_MOTION_KEY);
        return raw === null ? null : raw === '1';
    } catch {
        return null;
    }
}

export function writeStoredReduceMotion(value: boolean): void {
    try {
        localStorage.setItem(REDUCE_MOTION_KEY, value ? '1' : '0');
    } catch {
        /* storage unavailable; the toggle still works for this session */
    }
}

/** Sets or clears the attribute `src/index.css` keys its blanket motion-kill rule off of. */
export function applyReduceMotion(enabled: boolean): void {
    if (enabled) {
        document.documentElement.setAttribute('data-reduce-motion', 'true');
    } else {
        document.documentElement.removeAttribute('data-reduce-motion');
    }
}

/* --- text size ---------------------------------------------------------- */

const TEXT_SCALE_KEY = 'dev_econ_text_scale';

export const TEXT_SCALES = [
    { id: 'normal', label: 'Normal', scale: 1 },
    { id: 'large', label: 'Large', scale: 1.15 },
    { id: 'larger', label: 'Larger', scale: 1.3 },
] as const;

export type TextScaleId = (typeof TEXT_SCALES)[number]['id'];

const isScaleId = (value: string | null): value is TextScaleId =>
    TEXT_SCALES.some(option => option.id === value);

export function readStoredTextScale(): TextScaleId {
    try {
        const raw = localStorage.getItem(TEXT_SCALE_KEY);
        return isScaleId(raw) ? raw : 'normal';
    } catch {
        return 'normal';
    }
}

export function writeStoredTextScale(value: TextScaleId): void {
    try {
        localStorage.setItem(TEXT_SCALE_KEY, value);
    } catch {
        /* storage unavailable; the setting still works for this session */
    }
}

/**
 * Scales type by setting a custom property the root font-size is derived from.
 *
 * Every size in the interface is expressed in rem, so moving the root moves the
 * whole scale together and nothing has to be respecified. Layouts use relative
 * units and wrap, so larger text reflows rather than overflowing.
 */
export function applyTextScale(value: TextScaleId): void {
    const option = TEXT_SCALES.find(entry => entry.id === value) ?? TEXT_SCALES[0];
    document.documentElement.style.setProperty('--text-scale', String(option.scale));
}

/* --- contrast ----------------------------------------------------------- */

const HIGH_CONTRAST_KEY = 'dev_econ_high_contrast';

export function readStoredHighContrast(): boolean {
    try {
        return localStorage.getItem(HIGH_CONTRAST_KEY) === '1';
    } catch {
        return false;
    }
}

export function writeStoredHighContrast(value: boolean): void {
    try {
        localStorage.setItem(HIGH_CONTRAST_KEY, value ? '1' : '0');
    } catch {
        /* storage unavailable; the setting still works for this session */
    }
}

/**
 * The art direction deliberately uses low-contrast aged paper and muted ink.
 * This turns that down: text goes to the lightest paper tone, secondary text
 * stops being secondary, and the material overlays that sit on top of copy are
 * dialled back. `src/index.css` keys the rules off this attribute.
 */
export function applyHighContrast(enabled: boolean): void {
    if (enabled) {
        document.documentElement.setAttribute('data-high-contrast', 'true');
    } else {
        document.documentElement.removeAttribute('data-high-contrast');
    }
}

/**
 * Applies every stored display preference to the document.
 * Call once, at module load, from outside any component — so the attributes
 * land before first paint instead of flashing the un-preferred state in via an
 * effect after mount.
 */
export function initReduceMotionPreference(): void {
    applyReduceMotion(readStoredReduceMotion() ?? systemPrefersReducedMotion());
    applyTextScale(readStoredTextScale());
    applyHighContrast(readStoredHighContrast());
}
