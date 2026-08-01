import { useEffect, useState } from 'react';
import type { AchievementDef } from '../data/achievements';
import './AchievementToast.css';

interface AchievementToastProps {
    achievements: AchievementDef[];
    onDismiss: () => void;
}

/**
 * Slides in when something is earned and leaves on its own.
 *
 * The caller remounts this with a fresh `key` per batch, so `leaving` never has
 * to be reset here — resetting it synchronously in the effect would be a
 * cascading render, which this repo's lint config rejects outright.
 *
 * Deliberately understated: this game's rewards are supposed to feel like a
 * historian noting something down, not a slot machine paying out. Several can
 * land in one year, so they stack rather than queue.
 */
export function AchievementToast({ achievements, onDismiss }: AchievementToastProps) {
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        if (achievements.length === 0) return;

        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const hold = 4200 + achievements.length * 900;

        const fade = window.setTimeout(() => setLeaving(true), hold - (reduced ? 0 : 400));
        const done = window.setTimeout(onDismiss, hold);

        return () => {
            window.clearTimeout(fade);
            window.clearTimeout(done);
        };
    }, [achievements, onDismiss]);

    if (achievements.length === 0) return null;

    return (
        <div className={`toasts${leaving ? ' is-leaving' : ''}`} role="status" aria-live="polite">
            {achievements.map((achievement, index) => (
                <article
                    key={achievement.id}
                    className="toast"
                    style={{ animationDelay: `${index * 110}ms` }}
                >
                    <span className="toast-seal" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="22" height="22">
                            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.6" />
                            <path
                                d="M7.5 12.4 L10.6 15.4 L16.6 8.9"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </span>
                    <span className="toast-body">
                        <span className="toast-kicker">Recorded</span>
                        <strong className="toast-name">{achievement.name}</strong>
                        <span className="toast-desc">{achievement.description}</span>
                    </span>
                </article>
            ))}

            <button type="button" className="toast-dismiss" onClick={onDismiss}>
                Dismiss
            </button>
        </div>
    );
}
