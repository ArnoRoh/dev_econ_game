import type { NewspaperItem } from '../engine/types';
import { formatEffectList } from '../effectFormatting';
import './Newspaper.css';

interface NewspaperProps {
    countryName: string;
    year: number;
    items: NewspaperItem[];
    onContinue: () => void;
}

/**
 * The turn opens with consequences, not with choices. Every item here traces
 * back to a decision the player made years earlier — the masthead date and the
 * "traces back to" line are what make that connection legible.
 */
export function Newspaper({ countryName, year, items, onContinue }: NewspaperProps) {
    return (
        <div className="newspaper" role="region" aria-label={`The ${countryName} Herald, ${year}`}>
            <header className="newspaper-masthead">
                <span className="newspaper-rule" aria-hidden="true" />
                <h2>The {countryName} Herald</h2>
                <span className="newspaper-rule" aria-hidden="true" />
            </header>
            <p className="newspaper-dateline">{year} · Consequences of earlier decisions</p>

            <div className="newspaper-columns">
                {items.map(item => (
                    <article key={item.id} className={`newspaper-item tone-${item.tone}`}>
                        <h3 className="newspaper-headline">{item.headline}</h3>
                        <p className="newspaper-body">{item.narrative}</p>

                        {item.sourceTitle && (
                            <p className="newspaper-trace">
                                <span className="newspaper-trace-label">
                                    {item.origin === 'ignored'
                                        ? 'Because you left this unattended:'
                                        : item.origin === 'promise'
                                          ? 'A commitment you made:'
                                          : 'Traces back to:'}
                                </span>{' '}
                                {item.sourceTitle}
                            </p>
                        )}

                        {(Object.keys(item.effects).length > 0 || item.treasuryEffect) && (
                            <ul className="newspaper-effects">
                                {formatEffectList(item.effects, item.treasuryEffect).map(effect => (
                                    <li key={effect.label} className={effect.positive ? 'is-good' : 'is-bad'}>
                                        <span aria-hidden="true">{effect.positive ? '▲' : '▼'}</span> {effect.label}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </article>
                ))}
            </div>

            <button type="button" className="primary-button newspaper-continue" onClick={onContinue} autoFocus>
                To the cabinet room
            </button>
        </div>
    );
}
