import { useEffect, useRef, useState } from 'react';
import './YearTransition.css';

interface YearTransitionProps {
    fromYear: number;
    toYear: number;
    onDone: () => void;
}

/**
 * A brief beat between the debrief and the next cabinet session.
 *
 * Without it a decade passes in the time it takes to click twice, and nothing
 * in the interface registers that time is the resource being spent. It is
 * skippable on any key or click, and reduced-motion users get a much shorter
 * hold with no movement.
 */
export function YearTransition({ fromYear, toYear, onDone }: YearTransitionProps) {
    const [leaving, setLeaving] = useState(false);
    const doneRef = useRef(false);

    useEffect(() => {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const hold = reduced ? 260 : 1100;

        const finish = () => {
            if (doneRef.current) return;
            doneRef.current = true;
            onDone();
        };

        // Fade out slightly before handing back, so the next screen does not pop.
        const fadeTimer = window.setTimeout(() => setLeaving(true), Math.max(0, hold - 220));
        const doneTimer = window.setTimeout(finish, hold);

        const skip = () => finish();
        window.addEventListener('keydown', skip);
        window.addEventListener('pointerdown', skip);

        return () => {
            window.clearTimeout(fadeTimer);
            window.clearTimeout(doneTimer);
            window.removeEventListener('keydown', skip);
            window.removeEventListener('pointerdown', skip);
        };
    }, [onDone]);

    return (
        <div className={`year-turn${leaving ? ' is-leaving' : ''}`} role="status" aria-live="polite">
            <div className="year-turn-rule" aria-hidden="true" />
            <p className="year-turn-years">
                <span className="year-turn-from" aria-hidden="true">
                    {fromYear}
                </span>
                <span className="year-turn-to">{toYear}</span>
            </p>
            <p className="year-turn-caption">The year turns</p>
            <div className="year-turn-rule" aria-hidden="true" />
        </div>
    );
}
