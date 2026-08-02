import { doctrineReport, untestedConcepts } from '../engine/doctrineLogic';
import type { GameState } from '../engine/types';
import './DoctrineReport.css';

interface Props {
    state: GameState;
}

const CONTESTATION_TAG: Record<string, string> = {
    'well-supported': 'Well supported',
    contested: 'Contested',
    'actively-disputed': 'Actively disputed',
};

/**
 * What the theories were worth in this republic.
 *
 * Shown after the ending, alongside the profile. The concept cards state what
 * the literature believes; this states what happened when this government acted
 * on it. Holding the two apart is the entire educational argument of the game —
 * a mechanism can be well supported in general and still fail in a state that
 * cannot administer it.
 */
export function DoctrineReport({ state }: Props) {
    const records = doctrineReport(state);
    const untested = untestedConcepts(state);

    if (records.length === 0) return null;

    return (
        <section className="doctrine-report" aria-label="Doctrine report">
            <header className="doctrine-report__head">
                <h2>The Theories You Governed By</h2>
                <p>
                    What the literature claims is one thing. What happened when this government
                    acted on it, in this country, is another. Neither settles the other.
                </p>
            </header>

            <ul className="doctrine-list">
                {records.map(record => (
                    <li key={record.conceptId} className="doctrine-entry">
                        <div className="doctrine-entry__head">
                            <strong>{record.title}</strong>
                            {record.contestation && (
                                <span className={`doctrine-tag is-${record.contestation}`}>
                                    {CONTESTATION_TAG[record.contestation] ?? record.contestation}
                                </span>
                            )}
                            <span className="doctrine-count">
                                acted on {record.invoked}×
                            </span>
                        </div>
                        <p className="doctrine-verdict">{record.verdict}</p>
                    </li>
                ))}
            </ul>

            {untested.length > 0 && (
                <div className="doctrine-untested">
                    <h3>Met but never tested</h3>
                    <p>
                        These came up in a dossier and this government never governed by them. A
                        different run would tell you something about them that this one cannot.
                    </p>
                    <ul>
                        {untested.map(concept => (
                            <li key={concept.id}>{concept.title}</li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
}
