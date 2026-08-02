import { useEffect, useState } from 'react';
import { getVolume, isMuted, setMuted, setVolume } from '../audio';
import {
    TEXT_SCALES,
    applyHighContrast,
    applyReduceMotion,
    applyTextScale,
    readStoredHighContrast,
    readStoredReduceMotion,
    readStoredTextScale,
    systemPrefersReducedMotion,
    writeStoredHighContrast,
    writeStoredReduceMotion,
    writeStoredTextScale,
} from '../settings';
import type { TextScaleId } from '../settings';
import './SettingsPanel.css';

interface SettingsPanelProps {
    onClose: () => void;
}

/**
 * The options panel: audio and accessibility, nothing else. Follows the same
 * dialog shape as `PolicyLedger` and `AchievementGallery` — a backdrop click
 * or Escape both close it, and there is no separate focus trap beyond that.
 */
export function SettingsPanel({ onClose }: SettingsPanelProps) {
    const [volume, setVolumeState] = useState(() => getVolume());
    const [muted, setMutedState] = useState(() => isMuted());
    const [reduceMotion, setReduceMotionState] = useState(
        () => readStoredReduceMotion() ?? systemPrefersReducedMotion(),
    );
    const [textScale, setTextScaleState] = useState<TextScaleId>(() => readStoredTextScale());
    const [highContrast, setHighContrastState] = useState(() => readStoredHighContrast());

    // The dialog also closes on backdrop click; Escape gives keyboard users the
    // same exit without having to tab all the way to the close button.
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleVolumeChange = (next: number) => {
        setVolume(next);
        setVolumeState(next);
    };

    const handleTextScaleChange = (next: TextScaleId) => {
        applyTextScale(next);
        writeStoredTextScale(next);
        setTextScaleState(next);
    };

    const handleHighContrastChange = (next: boolean) => {
        applyHighContrast(next);
        writeStoredHighContrast(next);
        setHighContrastState(next);
    };

    const handleMutedChange = (next: boolean) => {
        setMuted(next);
        setMutedState(next);
    };

    const handleReduceMotionChange = (next: boolean) => {
        applyReduceMotion(next);
        writeStoredReduceMotion(next);
        setReduceMotionState(next);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="settings-panel"
                role="dialog"
                aria-modal="true"
                aria-label="Settings"
                onClick={event => event.stopPropagation()}
            >
                <header className="settings-header">
                    <h2 className="settings-title">Settings</h2>
                    <button
                        type="button"
                        className="settings-close"
                        onClick={onClose}
                        aria-label="Close settings"
                        title="Close settings (Esc)"
                    >
                        ×
                    </button>
                </header>

                <section className="settings-section">
                    <h3 className="settings-section-title">Audio</h3>

                    <div className="settings-row">
                        <label className="settings-label" htmlFor="settings-volume">
                            Master volume
                        </label>
                        <input
                            id="settings-volume"
                            className="settings-slider"
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            value={Math.round(volume * 100)}
                            disabled={muted}
                            aria-valuetext={`${Math.round(volume * 100)} percent`}
                            onChange={event => handleVolumeChange(Number(event.target.value) / 100)}
                        />
                        <span className="settings-value">
                            {muted ? 'Muted' : `${Math.round(volume * 100)}%`}
                        </span>
                    </div>

                    <label className="settings-toggle-row" htmlFor="settings-mute">
                        <span className="settings-label">Mute all sound</span>
                        <input
                            id="settings-mute"
                            className="settings-toggle"
                            type="checkbox"
                            checked={muted}
                            onChange={event => handleMutedChange(event.target.checked)}
                        />
                    </label>
                </section>

                <section className="settings-section">
                    <h3 className="settings-section-title">Accessibility</h3>

                    <label className="settings-toggle-row" htmlFor="settings-reduce-motion">
                        <span className="settings-label">Reduce motion</span>
                        <input
                            id="settings-reduce-motion"
                            className="settings-toggle"
                            type="checkbox"
                            checked={reduceMotion}
                            onChange={event => handleReduceMotionChange(event.target.checked)}
                        />
                    </label>
                    <p className="settings-hint">
                        Turns off animation and screen transitions throughout the game.
                    </p>

                    <div className="settings-row settings-row-stack">
                        <span className="settings-label" id="settings-text-size-label">Text size</span>
                        <div
                            className="settings-choices"
                            role="radiogroup"
                            aria-labelledby="settings-text-size-label"
                        >
                            {TEXT_SCALES.map(option => (
                                <button
                                    key={option.id}
                                    type="button"
                                    role="radio"
                                    aria-checked={textScale === option.id}
                                    className={`settings-choice${textScale === option.id ? ' is-active' : ''}`}
                                    onClick={() => handleTextScaleChange(option.id)}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <p className="settings-hint">
                        Scales every size in the interface together. Layouts reflow rather than
                        clipping.
                    </p>

                    <label className="settings-toggle-row" htmlFor="settings-contrast">
                        <span className="settings-label">Higher contrast</span>
                        <input
                            id="settings-contrast"
                            className="settings-toggle"
                            type="checkbox"
                            checked={highContrast}
                            onChange={event => handleHighContrastChange(event.target.checked)}
                        />
                    </label>
                    <p className="settings-hint">
                        Brightens text and removes the paper grain and vignette that sit over it.
                    </p>
                </section>
            </div>
        </div>
    );
}
