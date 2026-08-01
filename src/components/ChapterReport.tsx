import type { GameState } from '../engine/types';
import type { EndingDefinition } from '../engine/endingLogic';
import type { LearningSummary } from '../engine/learningLogic';
import { ECONOMIC_CONCEPTS } from '../data/concepts';
import { FACTIONS } from '../data/factions';
import './ChapterReport.css';

interface ChapterReportProps {
    state: GameState;
    ending: EndingDefinition;
    citations: string[];
    learning: LearningSummary;
    legacyScore: number;
    onOpenLedger: () => void;
    onRestart: () => void;
}

/**
 * The finale reports on the republic the player actually built — the political
 * settlement, the promises, the concepts encountered — rather than reducing the
 * run to a single number. The score is present but deliberately not the headline.
 */
export function ChapterReport({
    state,
    ending,
    citations,
    learning,
    legacyScore,
    onOpenLedger,
    onRestart,
}: ChapterReportProps) {
    const { country } = state;
    const gdpPerCapita = (country.gdp * 1_000_000) / (country.population * 1_000_000);
    const metConcepts = ECONOMIC_CONCEPTS.filter(
        concept => (state.conceptProgress?.[concept.id]?.exposures ?? 0) > 0,
    );

    return (
        <div className={`chapter-report tone-${ending.tone}`}>
            <header className="report-header">
                <p className="report-kicker">
                    {state.countryName} · 1960–{state.year}
                </p>
                <h1 className="report-ending-name">{ending.name}</h1>
                <p className="report-ending-summary">{ending.summary}</p>
            </header>

            <p className="report-verdict">{ending.verdict}</p>

            {state.gameOverReason && (
                <p className="report-cause">Immediate cause: {state.gameOverReason}</p>
            )}

            <section className="report-section">
                <h2 className="report-section-title">The republic you leave behind</h2>
                <div className="report-stats">
                    <div className="report-stat">
                        <span className="report-stat-value">${Math.round(gdpPerCapita)}</span>
                        <span className="report-stat-label">GDP per head</span>
                    </div>
                    <div className="report-stat">
                        <span className="report-stat-value">{Math.round(country.educationLevel)}%</span>
                        <span className="report-stat-label">Education</span>
                    </div>
                    <div className="report-stat">
                        <span className="report-stat-value">{Math.round(country.famineRisk)}%</span>
                        <span className="report-stat-label">Famine risk</span>
                    </div>
                    <div className="report-stat">
                        <span className="report-stat-value">{Math.round(country.genderEquality)}%</span>
                        <span className="report-stat-label">Gender equality</span>
                    </div>
                    <div className="report-stat">
                        <span className="report-stat-value">{Math.round(country.stability)}%</span>
                        <span className="report-stat-label">Stability</span>
                    </div>
                    <div className="report-stat">
                        <span className="report-stat-value">${Math.round(country.externalDebt)}M</span>
                        <span className="report-stat-label">External debt</span>
                    </div>
                </div>
            </section>

            {citations.length > 0 && (
                <section className="report-section">
                    <h2 className="report-section-title">What the record shows</h2>
                    <ul className="report-citations">
                        {citations.map(citation => (
                            <li key={citation}>{citation}</li>
                        ))}
                    </ul>
                </section>
            )}

            {state.factions && (
                <section className="report-section">
                    <h2 className="report-section-title">Who ended up holding power</h2>
                    <ul className="report-factions">
                        {FACTIONS.map(faction => {
                            const factionState = state.factions?.[faction.id];
                            if (!factionState) return null;
                            return (
                                <li key={faction.id}>
                                    <span className="report-faction-name">{faction.shortName}</span>
                                    <span className="report-faction-bar">
                                        <span
                                            className="report-faction-fill"
                                            style={{ width: `${factionState.support}%` }}
                                        />
                                    </span>
                                    <span className="report-faction-value">
                                        {Math.round(factionState.support)} support ·{' '}
                                        {Math.round(factionState.power)} power
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            )}

            <section className="report-section">
                <h2 className="report-section-title">What you took away</h2>
                <p className="report-learning">
                    You encountered <strong>{learning.conceptsMet}</strong> of {learning.conceptsTotal} economic
                    concepts, answered <strong>{learning.checksCorrect}</strong> of {learning.checksTaken}{' '}
                    knowledge checks correctly
                    {learning.forecastsJudged > 0 && (
                        <>
                            , and your advisors' forecasts proved right{' '}
                            <strong>{learning.forecastsRight}</strong> of {learning.forecastsJudged} times
                        </>
                    )}
                    .
                </p>
                {metConcepts.length > 0 && (
                    <ul className="report-concepts">
                        {metConcepts.map(concept => (
                            <li key={concept.id}>
                                <strong>{concept.title}</strong>
                                <span>{concept.oneSentenceSummary}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <p className="report-score">
                Legacy score <strong>{legacyScore}</strong>
            </p>

            <div className="report-actions">
                <button type="button" className="report-secondary" onClick={onOpenLedger}>
                    Read the full archive
                </button>
                <button type="button" className="primary-button" onClick={onRestart}>
                    Found another republic
                </button>
            </div>
        </div>
    );
}
