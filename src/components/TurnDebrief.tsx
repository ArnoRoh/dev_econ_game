import type { TurnDebriefEntry } from '../engine/types';
import { CHARACTERS_BY_ID } from '../data/characters';
import { FACTIONS_BY_ID } from '../data/factions';
import { formatEffectList } from '../effectFormatting';
import './TurnDebrief.css';

interface TurnDebriefProps {
    year: number;
    entries: TurnDebriefEntry[];
    ignoredTitles: string[];
    onContinue: () => void;
}

/**
 * Numbers appear here and nowhere earlier. The debrief closes the loop the
 * dossier opened: this is what you chose, this is what it did, and this is the
 * thing that has not happened yet but will.
 */
export function TurnDebrief({ year, entries, ignoredTitles, onContinue }: TurnDebriefProps) {
    return (
        <section className="debrief" aria-label={`Cabinet debrief for ${year}`}>
            <header className="debrief-header">
                <h2 className="debrief-title">Cabinet Debrief · {year}</h2>
                <p className="debrief-subtitle">What you did, and what it has set in motion.</p>
            </header>

            {entries.length === 0 && (
                <p className="debrief-empty">
                    You took no action this year. The cabinet notes it, and so does everyone who was waiting.
                </p>
            )}

            {entries.map(entry => {
                const sponsor = CHARACTERS_BY_ID[entry.sponsorId];
                const effects = formatEffectList(entry.effects, entry.treasuryEffect);

                return (
                    <article key={entry.decisionId} className="debrief-entry">
                        <h3 className="debrief-entry-title">{entry.proposalTitle}</h3>
                        <p className="debrief-choice">
                            You chose: <strong>{entry.optionText}</strong>
                        </p>
                        <p className="debrief-narrative">{entry.narrative}</p>

                        {effects.length > 0 && (
                            <div className="debrief-block">
                                <h4 className="debrief-block-title">Measured this year</h4>
                                <ul className="debrief-effects">
                                    {effects.map(effect => (
                                        <li key={effect.label} className={effect.positive ? 'is-good' : 'is-bad'}>
                                            {effect.label}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {entry.factionEffects.length > 0 && (
                            <div className="debrief-block">
                                <h4 className="debrief-block-title">How the room reacted</h4>
                                <ul className="debrief-factions">
                                    {entry.factionEffects.map(effect => {
                                        const faction = FACTIONS_BY_ID[effect.factionId];
                                        const delta = effect.support ?? 0;
                                        return (
                                            <li key={effect.factionId}>
                                                <span className="debrief-faction-name">{faction.shortName}</span>
                                                <span
                                                    className={`debrief-faction-delta ${
                                                        delta >= 0 ? 'is-good' : 'is-bad'
                                                    }`}
                                                >
                                                    {delta > 0 ? '+' : ''}
                                                    {delta}
                                                </span>
                                                {effect.grievance && (
                                                    <span className="debrief-grievance">{effect.grievance}</span>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}

                        {entry.watchFor.length > 0 && (
                            <div className="debrief-block debrief-watch">
                                <h4 className="debrief-block-title">
                                    Not settled yet — {sponsor.name} will report back
                                </h4>
                                <ul className="debrief-watch-list">
                                    {entry.watchFor.map(item => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </article>
                );
            })}

            {ignoredTitles.length > 0 && (
                <article className="debrief-entry debrief-ignored">
                    <h3 className="debrief-entry-title">Settled without you</h3>
                    <ul className="debrief-watch-list">
                        {ignoredTitles.map(title => (
                            <li key={title}>{title}</li>
                        ))}
                    </ul>
                    <p className="debrief-narrative">
                        These went ahead on their own terms. Whoever raised them noticed that you were elsewhere.
                    </p>
                </article>
            )}

            <button type="button" className="primary-button debrief-continue" onClick={onContinue} autoFocus>
                Let the year run
            </button>
        </section>
    );
}
