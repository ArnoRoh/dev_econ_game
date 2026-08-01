import { achievementProgress } from '../engine/achievementLogic';
import type { GameState } from '../engine/types';
import './AchievementGallery.css';

interface AchievementGalleryProps {
    state: GameState | null;
    onClose: () => void;
}

/**
 * The records room. Secret achievements stay redacted until earned, because the
 * darker ones — a famine survived, an election stolen — are outcomes the player
 * should discover by living them rather than read as a to-do list.
 */
export function AchievementGallery({ state, onClose }: AchievementGalleryProps) {
    // A player browsing from the title screen has no run; show everything locked.
    const rows = achievementProgress(state ?? ({ flags: {} } as GameState));
    const earnedCount = rows.filter(row => row.earned).length;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="gallery"
                role="dialog"
                aria-modal="true"
                aria-label="Achievements"
                onClick={event => event.stopPropagation()}
            >
                <header className="gallery-header">
                    <div>
                        <h2 className="gallery-title">Records</h2>
                        <p className="gallery-count">
                            {earnedCount} of {rows.length} recorded
                        </p>
                    </div>
                    <button type="button" className="gallery-close" onClick={onClose} aria-label="Close records">
                        ×
                    </button>
                </header>

                <div
                    className="gallery-bar"
                    role="img"
                    aria-label={`${earnedCount} of ${rows.length} achievements earned`}
                >
                    <span
                        className="gallery-bar-fill"
                        style={{ width: `${(earnedCount / Math.max(1, rows.length)) * 100}%` }}
                    />
                </div>

                <ul className="gallery-list">
                    {rows.map(({ def, earned }) => {
                        const hidden = Boolean(def.secret) && !earned;
                        return (
                            <li key={def.id} className={`gallery-item${earned ? ' is-earned' : ''}`}>
                                <span className="gallery-mark" aria-hidden="true">
                                    {earned ? '✓' : hidden ? '?' : '—'}
                                </span>
                                <span className="gallery-text">
                                    <strong className="gallery-name">
                                        {hidden ? 'Sealed record' : def.name}
                                    </strong>
                                    <span className="gallery-desc">
                                        {hidden
                                            ? 'Unsealed only by whatever it was that happened.'
                                            : def.description}
                                    </span>
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
