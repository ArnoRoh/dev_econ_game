import { useState } from 'react';
import type {
    CharacterId,
    CharacterState,
    EducationalPolicyOption,
    PolicyProposal,
    QualitativeForecast,
} from '../engine/types';
import { CHARACTERS_BY_ID } from '../data/characters';
import { FACTIONS_BY_ID } from '../data/factions';
import { ECONOMIC_CONCEPTS } from '../data/concepts';
import { SOURCES } from '../data/sources';
import './PolicyDossier.css';

interface PolicyDossierProps {
    proposal: PolicyProposal;
    characters?: Record<CharacterId, CharacterState>;
    advisorInsight: number;
    onSpendInsight: () => void;
    onConfirm: (option: EducationalPolicyOption) => void;
    onReject: () => void;
    onBack: () => void;
}

const DIRECTION_GLYPH: Record<QualitativeForecast['predictedDirection'], string> = {
    stronglyDown: '▼▼',
    down: '▼',
    mixed: '◆',
    up: '▲',
    stronglyUp: '▲▲',
};

const DIRECTION_WORD: Record<QualitativeForecast['predictedDirection'], string> = {
    stronglyDown: 'falls sharply',
    down: 'falls',
    mixed: 'cuts both ways',
    up: 'rises',
    stronglyUp: 'rises sharply',
};

/**
 * Progressive disclosure, per the educational design: the dispute first, the
 * mechanism on request, the evidence last. Numeric effects are deliberately
 * absent — the player commits under the same uncertainty a minister would.
 */
export function PolicyDossier({
    proposal,
    characters,
    advisorInsight,
    onSpendInsight,
    onConfirm,
    onReject,
    onBack,
}: PolicyDossierProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [openSection, setOpenSection] = useState<string | null>('mechanism');
    const [insightUsed, setInsightUsed] = useState(false);

    const sponsor = CHARACTERS_BY_ID[proposal.sponsorId];
    const concepts = ECONOMIC_CONCEPTS.filter(concept => proposal.conceptIds.includes(concept.id));
    const sources = SOURCES.filter(source => proposal.sourceIds.includes(source.id));

    const toggle = (id: string) => setOpenSection(current => (current === id ? null : id));

    const useInsight = () => {
        if (insightUsed || advisorInsight <= 0) return;
        setInsightUsed(true);
        onSpendInsight();
    };

    return (
        <section className="dossier" aria-label={`Policy dossier: ${proposal.title}`}>
            <button type="button" className="dossier-back" onClick={onBack}>
                ← Back to the cabinet table
            </button>

            <header className="dossier-header">
                <p className="dossier-sponsor">
                    Raised by <strong>{sponsor.name}</strong>, {sponsor.title}
                </p>
                <h2 className="dossier-title">{proposal.title}</h2>
                <p className="dossier-brief">{proposal.brief}</p>
            </header>

            <div className="dossier-section">
                <h3 className="dossier-section-title">Who benefits, who pays</h3>
                <p className="dossier-stakeholders">{proposal.stakeholderSummary}</p>
            </div>

            {concepts.map(concept => (
                <div key={concept.id} className="dossier-accordion">
                    <button
                        type="button"
                        className="dossier-accordion-head"
                        aria-expanded={openSection === 'mechanism'}
                        onClick={() => toggle('mechanism')}
                    >
                        <span>The mechanism · {concept.title}</span>
                        <span aria-hidden="true">{openSection === 'mechanism' ? '−' : '+'}</span>
                    </button>
                    {openSection === 'mechanism' && (
                        <div className="dossier-accordion-body">
                            <p className="dossier-concept-summary">{concept.oneSentenceSummary}</p>
                            <ol className="dossier-chain">
                                {concept.mechanismSteps.map(step => (
                                    <li key={step}>{step}</li>
                                ))}
                            </ol>

                            <h4 className="dossier-minor-heading">Where reasonable people disagree</h4>
                            <ul className="dossier-list">
                                {concept.competingViews.map(view => (
                                    <li key={view}>{view}</li>
                                ))}
                            </ul>

                            {insightUsed && (
                                <>
                                    <h4 className="dossier-minor-heading">
                                        Advisor Insight · assumptions this rests on
                                    </h4>
                                    <ul className="dossier-list dossier-list-insight">
                                        {concept.assumptions.map(assumption => (
                                            <li key={assumption}>{assumption}</li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>
                    )}
                </div>
            ))}

            {proposal.backgroundTheory && (
                <div className="dossier-accordion">
                    <button
                        type="button"
                        className="dossier-accordion-head"
                        aria-expanded={openSection === 'background'}
                        onClick={() => toggle('background')}
                    >
                        <span>The economics of this dispute</span>
                        <span aria-hidden="true">{openSection === 'background' ? '−' : '+'}</span>
                    </button>
                    {openSection === 'background' && (
                        <div className="dossier-accordion-body">
                            <div className="dossier-theory">{proposal.backgroundTheory}</div>
                            {(proposal.legacySource || proposal.wikiLink) && (
                                <p className="dossier-theory-source">
                                    {proposal.legacySource && <span>Source: {proposal.legacySource}</span>}
                                    {proposal.wikiLink && (
                                        <a href={proposal.wikiLink} target="_blank" rel="noopener noreferrer">
                                            Further reading ↗
                                        </a>
                                    )}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {sources.length > 0 && (
                <div className="dossier-accordion">
                    <button
                        type="button"
                        className="dossier-accordion-head"
                        aria-expanded={openSection === 'sources'}
                        onClick={() => toggle('sources')}
                    >
                        <span>Evidence ({sources.length})</span>
                        <span aria-hidden="true">{openSection === 'sources' ? '−' : '+'}</span>
                    </button>
                    {openSection === 'sources' && (
                        <div className="dossier-accordion-body">
                            <ul className="dossier-sources">
                                {sources.map(source => (
                                    <li key={source.id}>
                                        <span className="dossier-source-type">{source.sourceType}</span>{' '}
                                        {source.url ? (
                                            <a href={source.url} target="_blank" rel="noopener noreferrer">
                                                {source.title}
                                            </a>
                                        ) : (
                                            <span>{source.title}</span>
                                        )}
                                        <span className="dossier-source-meta">
                                            {' '}
                                            — {source.author}
                                            {source.year ? `, ${source.year}` : ''}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            <div className="dossier-options">
                <h3 className="dossier-section-title">
                    The decision
                    {advisorInsight > 0 && !insightUsed && (
                        <button type="button" className="dossier-insight-button" onClick={useInsight}>
                            Spend 1 Advisor Insight ({advisorInsight} held)
                        </button>
                    )}
                </h3>

                {proposal.options.map(option => {
                    const isSelected = option.id === selectedId;
                    return (
                        <div key={option.id} className={`dossier-option${isSelected ? ' is-selected' : ''}`}>
                            <button
                                type="button"
                                className="dossier-option-head"
                                aria-pressed={isSelected}
                                onClick={() => setSelectedId(isSelected ? null : option.id)}
                            >
                                <span className="dossier-option-text">{option.text}</span>
                                <span className="dossier-option-hint">
                                    {isSelected ? 'Selected' : 'Consider'}
                                </span>
                            </button>

                            {isSelected && (
                                <div className="dossier-option-body">
                                    <p className="dossier-rationale">{option.rationale}</p>

                                    <h4 className="dossier-minor-heading">What your advisors expect</h4>
                                    <ul className="dossier-forecasts">
                                        {option.forecasts.map(forecast => {
                                            const advisor = CHARACTERS_BY_ID[forecast.advisorId];
                                            const faction = FACTIONS_BY_ID[advisor.factionId];
                                            const trust = characters?.[forecast.advisorId]?.trust ?? 50;
                                            // A low-trust advisor's confidence is not worth what it claims.
                                            const shownConfidence =
                                                trust < 40 && forecast.confidence === 'high'
                                                    ? 'medium'
                                                    : forecast.confidence;

                                            return (
                                                <li
                                                    key={`${forecast.advisorId}-${forecast.summary}`}
                                                    className={`dossier-forecast dir-${forecast.predictedDirection}`}
                                                >
                                                    <span className="dossier-forecast-dir" aria-hidden="true">
                                                        {DIRECTION_GLYPH[forecast.predictedDirection]}
                                                    </span>
                                                    <span className="dossier-forecast-text">
                                                        <strong>{advisor.name}</strong>{' '}
                                                        <span className="dossier-forecast-faction">
                                                            ({faction.shortName})
                                                        </span>
                                                        <span className="dossier-forecast-summary">
                                                            {forecast.summary}
                                                        </span>
                                                        <span className="dossier-forecast-meta">
                                                            expects it {DIRECTION_WORD[forecast.predictedDirection]}
                                                            {forecast.affectedMetric
                                                                ? ` · ${forecast.affectedMetric}`
                                                                : ''}{' '}
                                                            · {shownConfidence} confidence
                                                            {insightUsed && forecast.hiddenBias
                                                                ? ` · interest: ${forecast.hiddenBias}`
                                                                : ''}
                                                        </span>
                                                    </span>
                                                </li>
                                            );
                                        })}
                                    </ul>

                                    <button
                                        type="button"
                                        className="primary-button dossier-commit"
                                        onClick={() => onConfirm(option)}
                                    >
                                        Commit to this — spends one action
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <footer className="dossier-footer">
                <button type="button" className="dossier-reject" onClick={onReject}>
                    Decline the whole proposal
                </button>
                <p className="dossier-footer-note">
                    Declining costs no action, but {sponsor.name} will remember that you heard the matter and
                    did nothing.
                </p>
            </footer>
        </section>
    );
}
