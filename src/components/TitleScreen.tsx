import { useState } from 'react';
import './TitleScreen.css';

interface TitleScreenProps {
    hasActiveSave: boolean;
    onContinue: () => void;
    onNewGame: () => void;
    onOpenAchievements: () => void;
    version: string;
}

/**
 * The front door. Deliberately quiet: a photograph, a title, and four ways in.
 * The animation is a slow ken-burns drift on the hero and a single sweep across
 * the rule under the title — enough to feel alive, not enough to distract from
 * a menu the player will see a hundred times.
 */
export function TitleScreen({
    hasActiveSave,
    onContinue,
    onNewGame,
    onOpenAchievements,
    version,
}: TitleScreenProps) {
    const [aboutOpen, setAboutOpen] = useState(false);

    return (
        <div className="title">
            <div className="title-hero" aria-hidden="true" />
            <div className="title-veil" aria-hidden="true" />

            <div className="title-inner">
                <header className="title-header">
                    <p className="title-kicker">A development-economics simulation</p>
                    <h1 className="title-name">
                        Post-Colonial
                        <span className="title-name-line">Republic</span>
                    </h1>
                    <span className="title-rule" aria-hidden="true" />
                    <p className="title-tag">
                        Seventy years. Four ministers who want different things. Every decision
                        arrives before the evidence does.
                    </p>
                </header>

                <nav className="title-menu" aria-label="Main menu">
                    {hasActiveSave && (
                        <button type="button" className="title-action is-primary" onClick={onContinue}>
                            <span className="title-action-name">Continue</span>
                            <span className="title-action-note">Resume your republic</span>
                        </button>
                    )}

                    <button
                        type="button"
                        className={`title-action${hasActiveSave ? '' : ' is-primary'}`}
                        onClick={onNewGame}
                    >
                        <span className="title-action-name">New republic</span>
                        <span className="title-action-note">
                            {hasActiveSave ? 'Abandons the run in progress' : 'Begin at independence, 1960'}
                        </span>
                    </button>

                    <button type="button" className="title-action" onClick={onOpenAchievements}>
                        <span className="title-action-name">Records</span>
                        <span className="title-action-note">Achievements and past governments</span>
                    </button>

                    <button
                        type="button"
                        className="title-action"
                        aria-expanded={aboutOpen}
                        onClick={() => setAboutOpen(open => !open)}
                    >
                        <span className="title-action-name">About</span>
                        <span className="title-action-note">What this game is arguing</span>
                    </button>
                </nav>

                {aboutOpen && (
                    <section className="title-about">
                        <p>
                            You govern a newly independent country from 1960 to 2030. Each year your
                            cabinet brings more matters than you have attention for, and you commit
                            without seeing the numbers — advisors give you forecasts, and some of them
                            are wrong.
                        </p>
                        <p>
                            The economics is real and cited. The argument it makes is that development
                            policy is conditional: land reform, protection, resource wealth and
                            austerity each succeed or fail depending on the institutions around them.
                            Nothing here is simply a good idea.
                        </p>
                        <p className="title-about-meta">Version {version}</p>
                    </section>
                )}
            </div>
        </div>
    );
}
