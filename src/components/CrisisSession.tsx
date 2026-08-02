import { useState } from 'react';
import type { CrisisSeverity, WorldCrisis } from '../data/crises';
import type { EducationalPolicyOption } from '../engine/types';
import { CHARACTERS } from '../data/characters';
import { SOURCES } from '../data/sources';
import './CrisisSession.css';

interface Props {
    crisis: WorldCrisis;
    severity: CrisisSeverity;
    /** Whether the player's profile has earned the exposure reading. */
    showSeverity: boolean;
    onChoose: (option: EducationalPolicyOption) => void;
}

const advisorName = (id: string): string =>
    CHARACTERS.find(character => character.id === id)?.name ?? 'An adviser';

const sourceLabel = (id: string): string | null => {
    const source = SOURCES.find(entry => entry.id === id);
    if (!source) return null;
    return `${source.author} (${source.year ?? 'n.d.'}), ${source.title}`;
};

/**
 * A world crisis, taking the whole sitting.
 *
 * Presented deliberately unlike the cabinet agenda: no list of competing
 * business, no option to decline, no action counter. The player is not choosing
 * what to spend a session on — the session has been chosen for them, and the
 * only question left is which way to answer.
 *
 * The dossier rule still holds. Nothing here shows a numeric effect before the
 * decision: options carry their rationale and their advisors' qualitative
 * forecasts, and the numbers appear in the debrief like everywhere else.
 */
export function CrisisSession({ crisis, severity, showSeverity, onChoose }: Props) {
    const [expanded, setExpanded] = useState<string | null>(null);
    const [showTheory, setShowTheory] = useState(false);

    return (
        <div className="crisis-session" role="region" aria-label={`World crisis: ${crisis.title}`}>
            <div className={`crisis-banner crisis-banner--${severity.level}`}>
                <span className="crisis-banner__flag">Emergency Session</span>
                <span className="crisis-banner__year">{crisis.year}</span>
            </div>

            <h2 className="crisis-title">{crisis.title}</h2>
            <p className="crisis-dispatch">{crisis.dispatch}</p>

            {showSeverity ? (
                <div className={`crisis-exposure crisis-exposure--${severity.level}`}>
                    <span className="crisis-exposure__label">Exposure: {severity.level}</span>
                    <p>{severity.reading}</p>
                </div>
            ) : (
                <div className="crisis-exposure crisis-exposure--unknown">
                    <span className="crisis-exposure__label">Exposure: not assessed</span>
                    <p>
                        No one has been able to tell the cabinet how badly this lands on a republic
                        built the way this one is. The assessment exists; the state cannot yet produce it.
                    </p>
                </div>
            )}

            <button
                type="button"
                className="crisis-theory-toggle"
                onClick={() => setShowTheory(value => !value)}
                aria-expanded={showTheory}
            >
                {showTheory ? 'Hide the economics' : 'What is actually happening here?'}
            </button>

            {showTheory && (
                <div className="crisis-theory">
                    {crisis.theory.split('\n\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                    ))}
                    <ul className="crisis-sources">
                        {crisis.sourceIds.map(id => {
                            const label = sourceLabel(id);
                            return label ? <li key={id}>{label}</li> : null;
                        })}
                    </ul>
                </div>
            )}

            <p className="crisis-instruction">
                The agenda is suspended. This sitting has one item on it and it cannot be deferred.
            </p>

            <div className="crisis-options">
                {crisis.options.map(option => {
                    const open = expanded === option.id;
                    return (
                        <article key={option.id} className={`crisis-option${open ? ' crisis-option--open' : ''}`}>
                            <button
                                type="button"
                                className="crisis-option__head"
                                onClick={() => setExpanded(open ? null : option.id)}
                                aria-expanded={open}
                            >
                                <h3>{option.text}</h3>
                                <p>{option.rationale}</p>
                            </button>

                            {open && (
                                <div className="crisis-option__body">
                                    <ul className="crisis-forecasts">
                                        {option.forecasts.map((forecast, index) => (
                                            <li key={index}>
                                                <strong>{advisorName(forecast.advisorId)}</strong>
                                                <span className="crisis-forecast__confidence">
                                                    {forecast.confidence} confidence
                                                </span>
                                                <p>{forecast.summary}</p>
                                            </li>
                                        ))}
                                    </ul>
                                    <button
                                        type="button"
                                        className="crisis-commit"
                                        onClick={() => onChoose(option)}
                                    >
                                        Commit the government to this
                                    </button>
                                </div>
                            )}
                        </article>
                    );
                })}
            </div>
        </div>
    );
}
