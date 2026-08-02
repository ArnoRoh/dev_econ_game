import { useEffect } from 'react';
import type { JSX } from 'react';
import type { CharacterDefinition, ForecastAudit } from '../engine/types';
import { MIN_CALLS_FOR_VERDICT, advisorCalibration } from '../engine/learningLogic';
import type { AdvisorCalibration } from '../engine/learningLogic';
import { Portrait } from './Portrait';
import './AdvisorRecords.css';

interface AdvisorRecordsProps {
    characters: CharacterDefinition[];
    audits: ForecastAudit[];
    onClose: () => void;
}

const METRIC_LABELS: Record<string, string> = {
    gdp: 'output',
    gdpGrowthRate: 'growth',
    stability: 'stability',
    eliteSatisfaction: 'elite opinion',
    militaryPower: 'the army',
    educationLevel: 'schooling',
    famineRisk: 'hunger',
    internationalRelations: 'foreign relations',
    genderEquality: 'women’s position',
    externalDebt: 'debt',
    population: 'population',
    treasury: 'the treasury',
    unstated: 'unstated matters',
};

const metricLabel = (metric: string): string => METRIC_LABELS[metric] ?? metric;
const percent = (value: number): string => `${Math.round(value * 100)}%`;

/**
 * Turn the numbers into the sentence the player actually needs. The panel is
 * useless if it only prints a hit rate — the point is to tell them how to
 * discount this particular voice.
 */
function verdictFor(calibration: AdvisorCalibration): string {
    const { hitRate, bias, confidentHitRate, hedgedHitRate, judged } = calibration;

    if (hitRate === null) {
        return `Only ${judged} call${judged === 1 ? '' : 's'} judged so far — too few to read anything into.`;
    }

    const parts: string[] = [];

    if (hitRate >= 0.7) parts.push('Has earned the benefit of the doubt.');
    else if (hitRate >= 0.55) parts.push('More often right than not.');
    else if (hitRate >= 0.45) parts.push('About as often right as wrong.');
    else parts.push('Has been wrong more often than not.');

    // Overconfidence is the finding worth leading on: an advisor no better when
    // certain than when hedging is giving the cabinet no information at all,
    // however authoritative they sound in the room.
    if (confidentHitRate !== null && hedgedHitRate !== null) {
        if (confidentHitRate + 0.1 < hedgedHitRate) {
            parts.push(
                `Worse when certain (${percent(confidentHitRate)}) than when hedging ` +
                    `(${percent(hedgedHitRate)}) — treat their confidence as a warning, not a signal.`,
            );
        } else if (confidentHitRate > hedgedHitRate + 0.1) {
            parts.push(
                `Genuinely better when certain (${percent(confidentHitRate)} against ` +
                    `${percent(hedgedHitRate)}) — their confidence carries information.`,
            );
        } else {
            parts.push('No more accurate when certain than when hedging.');
        }
    }

    if (bias > 0.15) parts.push('Their misses run optimistic.');
    else if (bias < -0.15) parts.push('Their misses run pessimistic.');

    return parts.join(' ');
}

/**
 * The run's record of who was right.
 *
 * Advisors are authored to be wrong sometimes, so a single missed forecast means
 * nothing and the per-decision archive already shows those. What cannot be seen
 * anywhere else is the pattern across a whole run — and learning to discount a
 * confident voice on the evidence of its track record is the transferable habit
 * this game is actually trying to teach.
 */
export function AdvisorRecords({ characters, audits, onClose }: AdvisorRecordsProps): JSX.Element {
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const anyJudged = audits.some(audit => audit.verdict);

    return (
        <div className="modal-overlay" onClick={onClose} role="presentation">
            <section
                className="records mat-grain"
                role="dialog"
                aria-modal="true"
                aria-labelledby="records-title"
                onClick={event => event.stopPropagation()}
            >
                <header className="records-header">
                    <div>
                        <h2 className="records-title" id="records-title">Who was right</h2>
                        <p className="records-sub">
                            Every forecast your ministers made, checked against what actually happened.
                        </p>
                    </div>
                    <button type="button" className="records-close" onClick={onClose} aria-label="Close">
                        ×
                    </button>
                </header>

                <hr className="rule-double" />

                {!anyJudged ? (
                    <p className="records-empty">
                        Nothing has been judged yet. Your ministers make a call before each decision;
                        once the year has run, this page keeps the score.
                    </p>
                ) : (
                    <ul className="records-list">
                        {characters.map(character => {
                            const calibration = advisorCalibration(audits, character.id);
                            const { right, partial, wrong, judged, hitRate } = calibration;
                            const confident = hitRate !== null && hitRate >= 0.7;
                            const poor = hitRate !== null && hitRate < 0.45;

                            return (
                                <li key={character.id} className="records-item">
                                    <span className="records-face" aria-hidden="true">
                                        <Portrait characterId={character.id} size={42} />
                                    </span>

                                    <div className="records-body">
                                        <div className="records-name-row">
                                            <strong className="records-name">{character.name}</strong>
                                            <span className="records-role">{character.title}</span>
                                        </div>

                                        {judged === 0 ? (
                                            <p className="records-verdict">
                                                Has not yet made a call that could be checked.
                                            </p>
                                        ) : (
                                            <>
                                                <div
                                                    className="records-bar"
                                                    role="img"
                                                    aria-label={
                                                        `${right} right, ${partial} partly right, ${wrong} wrong ` +
                                                        `of ${judged} judged`
                                                    }
                                                >
                                                    {/* Widths are inline because they are data, not style. */}
                                                    <i className="is-right" style={{ width: `${(right / judged) * 100}%` }} />
                                                    <i className="is-partial" style={{ width: `${(partial / judged) * 100}%` }} />
                                                    <i className="is-wrong" style={{ width: `${(wrong / judged) * 100}%` }} />
                                                </div>

                                                <p className="records-tally">
                                                    <span className="records-chip is-right">{right} right</span>
                                                    <span className="records-chip is-partial">{partial} partly</span>
                                                    <span className="records-chip is-wrong">{wrong} wrong</span>
                                                    {hitRate !== null && (
                                                        <span
                                                            className={
                                                                'records-rate'
                                                                + (confident ? ' is-good' : '')
                                                                + (poor ? ' is-poor' : '')
                                                            }
                                                        >
                                                            {percent(hitRate)} accurate
                                                        </span>
                                                    )}
                                                </p>

                                                <p className="records-verdict">{verdictFor(calibration)}</p>

                                                {calibration.weakestMetrics.length > 1 && judged >= MIN_CALLS_FOR_VERDICT && (
                                                    <p className="records-metrics">
                                                        Least reliable on{' '}
                                                        <em>{metricLabel(calibration.weakestMetrics[0].metric)}</em>
                                                        {' '}({calibration.weakestMetrics[0].right} of{' '}
                                                        {calibration.weakestMetrics[0].judged} right).
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}

                <p className="records-foot">
                    Some of these forecasts were wrong when they were written. Working out whose
                    confidence to discount is the same skill outside the game as inside it.
                </p>
            </section>
        </div>
    );
}
