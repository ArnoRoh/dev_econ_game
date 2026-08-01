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

/**
 * Applies the stored (or OS-default) motion preference to the document.
 * Call once, at module load, from outside any component — so the attribute
 * lands before first paint instead of flashing motion in via an effect after
 * mount.
 */
export function initReduceMotionPreference(): void {
    applyReduceMotion(readStoredReduceMotion() ?? systemPrefersReducedMotion());
}
