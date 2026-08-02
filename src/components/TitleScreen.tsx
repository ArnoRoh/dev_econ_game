import { useState } from 'react';
import './TitleScreen.css';

interface TitleScreenProps {
    hasActiveSave: boolean;
    onContinue: () => void;
    onNewGame: () => void;
    onOpenAchievements: () => void;
    version: string;
}

/** Angles for the emblem's sunburst rays — alternating long and short spokes. */
const EMBLEM_RAYS = Array.from({ length: 16 }, (_, i) => i * 22.5);

/** Angles for the small laurel-like spray struck along the base of the seal. */
const EMBLEM_LEAVES = [-64, -46, -30, -14, 14, 30, 46, 64];

/** Fixed positions for the drifting dust motes, so the layout never shifts. */
const MOTES = [
    { left: '14%', top: '20%', size: 3, delay: '0s', dur: '23s' },
    { left: '29%', top: '62%', size: 2, delay: '4s', dur: '27s' },
    { left: '47%', top: '12%', size: 2, delay: '9s', dur: '31s' },
    { left: '63%', top: '46%', size: 3, delay: '2s', dur: '25s' },
    { left: '76%', top: '74%', size: 2, delay: '11s', dur: '29s' },
    { left: '87%', top: '28%', size: 3, delay: '6s', dur: '33s' },
];

/**
 * The front door. Deliberately quiet: a photograph, a seal, a masthead, and
 * four ways in. The animation is a slow ken-burns drift on the hero, dust
 * settling through the light, and a single brass sweep across the title —
 * enough to feel alive, not enough to distract from a menu the player will
 * see a hundred times.
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
        <div className="title mat-grain mat-vignette">
            <div className="title-hero" aria-hidden="true" />
            <div className="title-veil" aria-hidden="true" />
            <div className="title-frame" aria-hidden="true" />

            <div className="title-motes" aria-hidden="true">
                {MOTES.map((mote, i) => (
                    <span
                        key={i}
                        className="title-mote"
                        style={{
                            left: mote.left,
                            top: mote.top,
                            width: mote.size,
                            height: mote.size,
                            animationDelay: mote.delay,
                            animationDuration: mote.dur,
                        }}
                    />
                ))}
            </div>

            <div className="title-inner">
                <div className="title-emblem anim-settle" aria-hidden="true">
                    <svg className="title-emblem-mark" viewBox="0 0 120 120" role="presentation">
                        <defs>
                            <radialGradient id="title-emblem-sun" cx="50%" cy="42%" r="62%">
                                <stop offset="0%" stopColor="var(--brass-100)" />
                                <stop offset="58%" stopColor="var(--brass-200)" />
                                <stop offset="100%" stopColor="var(--brass-400)" />
                            </radialGradient>
                        </defs>
                        <g className="emblem-rays">
                            {EMBLEM_RAYS.map((angle, i) => (
                                <line
                                    key={angle}
                                    x1="60"
                                    y1="60"
                                    x2="60"
                                    y2={i % 2 === 0 ? 11 : 24}
                                    transform={`rotate(${angle} 60 60)`}
                                />
                            ))}
                        </g>
                        <circle className="emblem-ring-outer" cx="60" cy="60" r="56" />
                        <circle className="emblem-ring-ticks" cx="60" cy="60" r="50" />
                        <g className="emblem-leaves">
                            {EMBLEM_LEAVES.map(angle => (
                                <ellipse key={angle} cx="60" cy="97" rx="3" ry="9" transform={`rotate(${angle} 60 60)`} />
                            ))}
                        </g>
                        <circle className="emblem-disc" cx="60" cy="60" r="17" fill="url(#title-emblem-sun)" />
                        <circle className="emblem-disc-ring" cx="60" cy="60" r="17" />
                    </svg>
                </div>

                <header className="title-header">
                    <p className="title-kicker type-eyebrow anim-rise" style={{ animationDelay: '80ms' }}>
                        A development-economics simulation
                    </p>
                    <h1 className="title-name type-letterpress anim-rise" style={{ animationDelay: '160ms' }}>
                        Post-Colonial
                        <span className="title-name-line type-foil">Republic</span>
                    </h1>
                    <span className="title-rule rule-double" aria-hidden="true" />
                    <p className="title-tag anim-rise" style={{ animationDelay: '340ms' }}>
                        Seventy years. Four ministers who want different things. Every decision
                        arrives before the evidence does.
                    </p>
                </header>

                <nav className="title-menu" aria-label="Main menu">
                    {hasActiveSave && (
                        <button
                            type="button"
                            className="title-action is-primary"
                            style={{ animationDelay: '420ms' }}
                            onClick={onContinue}
                        >
                            <span className="title-action-name">Continue</span>
                            <span className="title-action-note">Resume your republic</span>
                        </button>
                    )}

                    <button
                        type="button"
                        className={`title-action${hasActiveSave ? '' : ' is-primary'}`}
                        style={{ animationDelay: hasActiveSave ? '470ms' : '420ms' }}
                        onClick={onNewGame}
                    >
                        <span className="title-action-name">New republic</span>
                        <span className="title-action-note">
                            {hasActiveSave ? 'Abandons the run in progress' : 'Begin at independence, 1960'}
                        </span>
                    </button>

                    <button
                        type="button"
                        className="title-action"
                        style={{ animationDelay: hasActiveSave ? '520ms' : '470ms' }}
                        onClick={onOpenAchievements}
                    >
                        <span className="title-action-name">Records</span>
                        <span className="title-action-note">Achievements and past governments</span>
                    </button>

                    <button
                        type="button"
                        className="title-action"
                        style={{ animationDelay: hasActiveSave ? '570ms' : '520ms' }}
                        aria-expanded={aboutOpen}
                        onClick={() => setAboutOpen(open => !open)}
                    >
                        <span className="title-action-name">About</span>
                        <span className="title-action-note">What this game is arguing</span>
                    </button>
                </nav>

                {aboutOpen && (
                    <section className="title-about mat-paper mat-grain">
                        <p className="title-about-lede type-letterpress">
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
                        <p className="title-about-meta type-eyebrow">Version {version}</p>
                    </section>
                )}
            </div>
        </div>
    );
}
