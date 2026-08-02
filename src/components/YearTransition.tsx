import { useEffect, useRef, useState } from 'react';
import './YearTransition.css';

interface YearTransitionProps {
    fromYear: number;
    toYear: number;
    onDone: () => void;
}

/**
 * True when motion should be held down, whether that comes from the OS-level
 * media query or the in-game settings toggle (which stamps the root element
 * rather than changing the media query the browser reports).
 */
const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.getAttribute('data-reduce-motion') === 'true';

/**
 * A brief beat between the debrief and the next cabinet session.
 *
 * Without it a decade passes in the time it takes to click twice, and nothing
 * in the interface registers that time is the resource being spent. It reads
 * as a date stamped into a ledger: a ring strikes down, the old year lifts
 * away, the new one lands in brass. It is skippable on any key or click, and
 * reduced-motion users get a much shorter hold with no movement.
 */
export function YearTransition({ fromYear, toYear, onDone }: YearTransitionProps) {
    const [leaving, setLeaving] = useState(false);
    const doneRef = useRef(false);

    useEffect(() => {
        const reduced = prefersReducedMotion();
        const hold = reduced ? 260 : 1150;

        const finish = () => {
            if (doneRef.current) return;
            doneRef.current = true;
            onDone();
        };

        // Fade out slightly before handing back, so the next screen does not pop.
        const fadeTimer = window.setTimeout(() => setLeaving(true), Math.max(0, hold - 220));
        const doneTimer = window.setTimeout(finish, hold);

        // Enter is bound globally in App as "the single forward move for this
        // phase", so a player moving at speed is usually still on the key, or
        // already pressing it again, when this mounts. Listening from the first
        // frame let that momentum skip the transition instantly — the year turned
        // with nothing visible between one cabinet and the next. Watching keyup
        // rather than keydown means a held key cannot skip what it just opened,
        // and the short arming delay covers a fast second press. Neither is
        // perceptible when the skip is actually wanted.
        const ARM_DELAY = 320;
        let armed = false;
        const skip = () => {
            if (!armed) return;
            finish();
        };
        const armTimer = window.setTimeout(() => {
            armed = true;
        }, ARM_DELAY);

        window.addEventListener('keyup', skip);
        window.addEventListener('pointerdown', skip);

        return () => {
            window.clearTimeout(fadeTimer);
            window.clearTimeout(doneTimer);
            window.clearTimeout(armTimer);
            window.removeEventListener('keyup', skip);
            window.removeEventListener('pointerdown', skip);
        };
    }, [onDone]);

    return (
        <div className={`year-turn${leaving ? ' is-leaving' : ''}`} role="status" aria-live="polite">
            <div className="year-turn-grain" aria-hidden="true" />
            <div className="year-turn-rule rule-double" aria-hidden="true" />

            <div className="year-turn-dial">
                <span className="year-turn-burst" aria-hidden="true" />
                <span className="year-turn-ring" aria-hidden="true" />
                <p className="year-turn-years">
                    <span className="year-turn-from type-letterpress" aria-hidden="true">
                        {fromYear}
                    </span>
                    <span className="year-turn-to type-foil">{toYear}</span>
                </p>
            </div>

            <p className="year-turn-caption type-eyebrow">The year turns</p>
            <div className="year-turn-progress" aria-hidden="true">
                <span className="year-turn-progress-fill" />
            </div>
            <div className="year-turn-rule rule-double" aria-hidden="true" />
        </div>
    );
}
