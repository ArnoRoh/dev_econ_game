import type { TurnDebriefEntry } from '../engine/types';
import { CHARACTERS_BY_ID } from '../data/characters';
import { FACTIONS_BY_ID } from '../data/factions';
import { formatEffect, formatEffectList } from '../effectFormatting';
import './TurnDebrief.css';

interface TurnDebriefProps {
    year: number;
    entries: TurnDebriefEntry[];
    ignoredTitles: string[];
    /**
     * The year the next session sits in. A session covers several years now, so
     * the button has to name what the player is actually skipping past —
     * "let the year run" was true when a turn was a year and is not any more.
     */
    nextYear?: number;
    onContinue: () => void;
}

/**
 * Split "Label: value" into a ledger row's two halves. Every string this
 * component receives from formatEffectList / formatEffect is built with
 * exactly one ": " separator, so a single split is safe.
 */
function splitLedgerLabel(label: string): [string, string] {
    const index = label.indexOf(': ');
    if (index === -1) return [label, ''];
    return [label.slice(0, index), label.slice(index + 2)];
}

/**
 * Numbers appear here and nowhere earlier. The debrief closes the loop the
 * dossier opened: this is what you chose, this is what it did, and this is the
 * thing that has not happened yet but will.
 */
export function TurnDebrief({ year, entries, ignoredTitles, nextYear, onContinue }: TurnDebriefProps) {
    return (
        <section className="debrief" aria-label={`Cabinet debrief for ${year}`}>
            <header className="debrief-header">
                <h2 className="debrief-title">Cabinet Debrief · {year}</h2>
                <p className="debrief-subtitle">What you did, and what it has set in motion.</p>
            </header>

            {entries.length === 0 && (
                <p className="debrief-empty">
                    You took no action this session. The cabinet notes it, and so does everyone who was waiting.
                </p>
            )}

            {entries.map(entry => {
                const sponsor = CHARACTERS_BY_ID[entry.sponsorId];
                const effects = formatEffectList(entry.effects, entry.treasuryEffect);

                return (
                    <article key={entry.decisionId} className="debrief-entry mat-paper">
                        <p className="debrief-entry-kicker" aria-hidden="true">
                            Entered in the Record
                        </p>
                        <h3 className="debrief-entry-title">{entry.proposalTitle}</h3>
                        <p className="debrief-choice">
                            You chose: <strong>{entry.optionText}</strong>
                        </p>
                        <p className="debrief-narrative">{entry.narrative}</p>

                        {effects.length > 0 && (
                            <div className="debrief-block">
                                <h4 className="debrief-block-title">Measured at once</h4>
                                <ul className="debrief-ledger">
                                    {effects.map(effect => {
                                        const [name, value] = splitLedgerLabel(effect.label);
                                        return (
                                            <li
                                                key={effect.label}
                                                className={`debrief-ledger-row ${
                                                    effect.positive ? 'is-good' : 'is-bad'
                                                }`}
                                            >
                                                <span className="debrief-ledger-label">{name}</span>
                                                <span className="debrief-ledger-leader" aria-hidden="true" />
                                                <span className="debrief-ledger-value">
                                                    <span className="debrief-ledger-glyph" aria-hidden="true">
                                                        {effect.positive ? '▲' : '▼'}
                                                    </span>
                                                    {effect.positive ? value : `(${value})`}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}

                        {entry.factionEffects.length > 0 && (
                            <div className="debrief-block">
                                <h4 className="debrief-block-title">How the room reacted</h4>
                                <ul className="debrief-ledger">
                                    {entry.factionEffects.map(effect => {
                                        const faction = FACTIONS_BY_ID[effect.factionId];
                                        const delta = effect.support ?? 0;
                                        const isGood = delta >= 0;
                                        return (
                                            <li
                                                key={effect.factionId}
                                                className={`debrief-ledger-row ${isGood ? 'is-good' : 'is-bad'}`}
                                            >
                                                <span className="debrief-ledger-label">
                                                    {faction.shortName}
                                                    {effect.grievance && (
                                                        <span className="debrief-grievance">
                                                            {' '}
                                                            {effect.grievance}
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="debrief-ledger-leader" aria-hidden="true" />
                                                <span className="debrief-ledger-value">
                                                    <span className="debrief-ledger-glyph" aria-hidden="true">
                                                        {isGood ? '▲' : '▼'}
                                                    </span>
                                                    {isGood ? `${delta > 0 ? '+' : ''}${delta}` : `(${-delta})`}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}

                        {entry.prediction && (
                            <div className="debrief-block">
                                <h4 className="debrief-block-title">Your call</h4>
                                <p
                                    className={`debrief-prediction ${
                                        entry.predictionCorrect ? 'is-right' : 'is-wrong'
                                    }`}
                                >
                                    <span aria-hidden="true">
                                        {entry.predictionCorrect ? '✓' : '✗'}
                                    </span>{' '}
                                    You expected{' '}
                                    {entry.prediction === 'up'
                                        ? 'an improvement'
                                        : entry.prediction === 'down'
                                          ? 'a worsening'
                                          : 'little change'}
                                    {entry.predictionMetric && (
                                        <>
                                            {' '}in{' '}
                                            <strong>
                                                {formatEffect(entry.predictionMetric, 0).split(':')[0]}
                                            </strong>
                                        </>
                                    )}
                                    . {entry.predictionCorrect ? 'That is what happened.' : 'It went the other way.'}
                                </p>
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
                <article className="debrief-entry debrief-ignored mat-paper">
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
                {nextYear && nextYear > year + 1
                    ? `Rise until ${nextYear}`
                    : 'Let the year run'}
            </button>
        </section>
    );
}
