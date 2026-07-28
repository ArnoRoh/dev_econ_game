import type { DecisionOutcome } from '../engine/types';
import { effectTone, formatEffect } from '../effectFormatting';
import './OutcomeBanner.css';

export type { DecisionOutcome } from '../engine/types';

export const OutcomeBanner = ({ outcome }: { outcome: DecisionOutcome }) => (
    <section className="outcome-banner">
        <div className="outcome-copy">
            <span className="outcome-kicker">Cabinet decision · {outcome.eventTitle}</span>
            <h3>{outcome.optionText}</h3>
            {outcome.explanation && <p>{outcome.explanation}</p>}
        </div>
        <div className="outcome-effects">
            {Object.entries(outcome.effects).map(([key, value]) => (
                <span className={effectTone(key, value)} key={key}>
                    {formatEffect(key, value)}
                </span>
            ))}
        </div>
    </section>
);
