import type { NewspaperItem } from '../engine/types';
import { formatEffectList } from '../effectFormatting';
import './Newspaper.css';

interface NewspaperProps {
    countryName: string;
    year: number;
    items: NewspaperItem[];
    onContinue: () => void;
}

/** Small-caps roman numerals for the masthead volume line — no library, just arithmetic. */
function toRoman(value: number): string {
    const table: [number, string][] = [
        [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
        [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
        [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
    ];
    let remaining = Math.max(1, value);
    let out = '';
    for (const [amount, glyph] of table) {
        while (remaining >= amount) {
            out += glyph;
            remaining -= amount;
        }
    }
    return out;
}

const traceLabel = (item: NewspaperItem) =>
    item.origin === 'ignored'
        ? 'Because you left this unattended:'
        : item.origin === 'promise'
          ? 'A commitment you made:'
          : 'Traces back to:';

function Trace({ item }: { item: NewspaperItem }) {
    if (!item.sourceTitle) return null;
    return (
        <p className="newspaper-trace">
            <span className="newspaper-trace-label">{traceLabel(item)}</span> {item.sourceTitle}
        </p>
    );
}

function Effects({ item }: { item: NewspaperItem }) {
    if (Object.keys(item.effects).length === 0 && !item.treasuryEffect) return null;
    return (
        <ul className="newspaper-effects">
            {formatEffectList(item.effects, item.treasuryEffect).map(effect => (
                <li key={effect.label} className={effect.positive ? 'is-good' : 'is-bad'}>
                    <span className="newspaper-effect-glyph" aria-hidden="true">
                        {effect.positive ? '▲' : '▼'}
                    </span>
                    {effect.label}
                </li>
            ))}
        </ul>
    );
}

/**
 * The turn opens with consequences, not with choices. Every item here traces
 * back to a decision the player made years earlier — the masthead date and the
 * "traces back to" line are what make that connection legible.
 *
 * Printed as a broadsheet: masthead in the display face, a lead story pulled
 * out of the run with a drop cap, and the remaining reports set in newspaper
 * columns that the browser itself collapses to one on a narrow screen.
 */
export function Newspaper({ countryName, year, items, onContinue }: NewspaperProps) {
    const [lead, ...rest] = items;
    const volume = toRoman(year - 1959);

    return (
        <div className="newspaper mat-paper" role="region" aria-label={`The ${countryName} Herald, ${year}`}>
            <header className="newspaper-masthead">
                <p className="newspaper-eyebrow type-eyebrow">Independent &amp; Non-Aligned</p>
                <h2 className="newspaper-title">The {countryName} Herald</h2>
                <div className="rule-double newspaper-masthead-rule" aria-hidden="true" />
                <div className="newspaper-dateline-row">
                    <span>Vol. {volume}</span>
                    <span className="newspaper-dateline-center">
                        {year} &middot; Consequences of Earlier Decisions
                    </span>
                    <span>Price: Two Shillings</span>
                </div>
            </header>

            {lead && (
                <article className={`newspaper-lead tone-${lead.tone}`}>
                    <span className="newspaper-kicker" aria-hidden="true" />
                    <h3 className="newspaper-lead-headline">{lead.headline}</h3>
                    <Trace item={lead} />
                    <p className="newspaper-lead-body">{lead.narrative}</p>
                    <Effects item={lead} />
                </article>
            )}

            {rest.length > 0 && (
                <div className="newspaper-columns">
                    {rest.map(item => (
                        <article key={item.id} className={`newspaper-item tone-${item.tone}`}>
                            <span className="newspaper-kicker" aria-hidden="true" />
                            <h3 className="newspaper-headline">{item.headline}</h3>
                            <p className="newspaper-body">{item.narrative}</p>
                            <Trace item={item} />
                            <Effects item={item} />
                        </article>
                    ))}
                </div>
            )}

            <div className="newspaper-folio">
                <div className="rule-double" aria-hidden="true" />
                <p>
                    The {countryName} Herald &middot; {year} &middot; Continued in the Cabinet Archive
                </p>
            </div>

            <button type="button" className="primary-button newspaper-continue" onClick={onContinue} autoFocus>
                To the cabinet room
            </button>
        </div>
    );
}
