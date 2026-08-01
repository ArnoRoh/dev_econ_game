import { useEffect, useState } from 'react';
import './StatCounter.css';

export type StatCounterFormat = 'plain' | 'currency' | 'percent';

export interface StatCounterProps {
    value: number;
    /** 'plain' -> 1,234 · 'currency' -> $1,234M · 'percent' -> 42% */
    format?: StatCounterFormat;
    durationMs?: number;
    /** Inverts which direction counts as good, for things like debt. */
    lowerIsBetter?: boolean;
}

type FlashDirection = 'good' | 'bad' | null;

interface DeltaChip {
    id: number;
    text: string;
    direction: 'good' | 'bad';
}

interface TweenRequest {
    from: number;
    to: number;
    /** True when prefers-reduced-motion means the value already jumped to
     *  `to` during render, and the effect only needs to hold + fade the flash. */
    immediate: boolean;
}

/** All three formats in this game render whole units, so a single rounding
 *  rule keeps the tween from flickering decimals without branching per format. */
const round = (raw: number) => Math.round(raw);

const formatValue = (raw: number, format: StatCounterFormat): string => {
    const rounded = round(raw);
    switch (format) {
        case 'currency':
            return `$${rounded.toLocaleString()}M`;
        case 'percent':
            return `${rounded}%`;
        default:
            return rounded.toLocaleString();
    }
};

const formatDelta = (delta: number, format: StatCounterFormat): string => {
    const rounded = round(delta);
    const arrow = rounded >= 0 ? '▲' : '▼';
    const sign = rounded >= 0 ? '+' : '−';
    const magnitude = Math.abs(rounded);
    const body = format === 'currency'
        ? `$${magnitude.toLocaleString()}M`
        : format === 'percent'
            ? `${magnitude}%`
            : magnitude.toLocaleString();
    return `${arrow} ${sign}${body}`;
};

/** How long a settled flash tint lingers before it fades, when the tween
 *  itself is skipped for prefers-reduced-motion (there is no tween-end to
 *  key the fade off of, so we hold briefly on a fixed timer instead). */
const REDUCED_MOTION_FLASH_HOLD_MS = 700;

const usePrefersReducedMotion = (): boolean => {
    const [prefers, setPrefers] = useState(
        () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return;
        }
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        const handleChange = () => setPrefers(query.matches);
        query.addEventListener('change', handleChange);
        return () => query.removeEventListener('change', handleChange);
    }, []);

    return prefers;
};

/**
 * A number readout for the status bar (treasury, stability, advisor insight)
 * that tweens between values, tints for the direction of change, and shows a
 * transient delta chip. Safe to mount many times on one screen: all state is
 * local to the instance, and pending rAF/timeout work is always cancelled on
 * cleanup so a rapid string of value changes cannot leak callbacks or call
 * setState after unmount.
 */
export function StatCounter({
    value,
    format = 'plain',
    durationMs = 600,
    lowerIsBetter = false,
}: StatCounterProps) {
    const prefersReducedMotion = usePrefersReducedMotion();

    // Seeding displayed state with `value` means the first paint already
    // shows the correct number with no tween and no delta chip (behaviour 4).
    const [displayed, setDisplayed] = useState(value);
    const [flash, setFlash] = useState<FlashDirection>(null);
    const [chips, setChips] = useState<DeltaChip[]>([]);
    const [tween, setTween] = useState<TweenRequest | null>(null);

    // Mirrors `value` so render can detect "the prop changed since last time"
    // without an Effect. This is React's documented pattern for adjusting
    // state in response to a prop change (see "Adjusting some state when a
    // prop changes" in the React docs) -- it runs during render itself, is
    // batched into the same commit, and needs no extra render/effect round
    // trip the way deriving this in a useEffect would.
    const [prevValue, setPrevValue] = useState(value);
    // A render-derived counter (not a ref: refs must not be read or written
    // during render) used only to give each transient delta chip a stable,
    // unique React key.
    const [nextChipId, setNextChipId] = useState(0);

    if (value !== prevValue) {
        const from = prevValue;
        const to = value;
        setPrevValue(to);

        // Nothing perceptible changed for this format's rounding: the
        // already-rendered text for `from` reads identically to `to`, so
        // there is nothing to animate.
        if (round(from) !== round(to)) {
            const delta = to - from;
            const isGoodChange = lowerIsBetter ? delta < 0 : delta > 0;
            const direction: 'good' | 'bad' = isGoodChange ? 'good' : 'bad';

            const chipId = nextChipId;
            setNextChipId(chipId + 1);

            setFlash(direction);
            setChips(previous => [...previous, { id: chipId, text: formatDelta(delta, format), direction }]);

            if (prefersReducedMotion) {
                setDisplayed(to);
            }

            setTween({ from, to, immediate: prefersReducedMotion });
        }
    }

    // The animation itself is the one true side effect here: it subscribes to
    // the browser's frame clock (or a timer, for reduced motion) and only
    // touches state from inside those callbacks -- never synchronously in the
    // effect body -- so a burst of value changes can never pile up renders.
    useEffect(() => {
        if (tween === null) {
            return;
        }

        if (tween.immediate) {
            const holdTimeout = window.setTimeout(() => {
                setFlash(null);
            }, REDUCED_MOTION_FLASH_HOLD_MS);

            return () => {
                window.clearTimeout(holdTimeout);
            };
        }

        const { from, to } = tween;
        const start = performance.now();
        let frame: number;

        const tick = (now: number) => {
            const elapsed = now - start;
            const t = durationMs > 0 ? Math.min(1, elapsed / durationMs) : 1;
            const eased = 1 - Math.pow(1 - t, 3);
            setDisplayed(from + (to - from) * eased);

            if (t < 1) {
                frame = requestAnimationFrame(tick);
            } else {
                // Fade the tint out now that the tween has actually ended.
                setFlash(null);
            }
        };

        frame = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(frame);
        };
    }, [tween, durationMs]);

    const flashClass = flash === 'good'
        ? ' stat-counter-flash-good'
        : flash === 'bad'
            ? ' stat-counter-flash-bad'
            : '';

    return (
        <span className="stat-counter">
            {/*
                The tweening number repaints every animation frame, which would
                spam a screen reader mid-count. So it is hidden from assistive
                tech (aria-hidden) and a visually hidden aria-live region below
                carries the settled prop value instead -- its text only changes
                once per real update, so screen readers hear the final number,
                not every intermediate frame.
            */}
            <span className={`stat-counter-value${flashClass}`} aria-hidden="true">
                {formatValue(displayed, format)}
            </span>
            <span className="stat-counter-sr-only" aria-live="polite" aria-atomic="true">
                {formatValue(value, format)}
            </span>
            {chips.map(chip => (
                <span
                    key={chip.id}
                    className={`stat-counter-chip stat-counter-chip-${chip.direction}`}
                    aria-hidden="true"
                    onAnimationEnd={() => {
                        setChips(previous => previous.filter(item => item.id !== chip.id));
                    }}
                >
                    {chip.text}
                </span>
            ))}
        </span>
    );
}
