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
import { headlineMetric } from '../engine/learningLogic';
import { Portrait } from './Portrait';
import { SOURCES } from '../data/sources';
import './PolicyDossier.css';

export type PredictionChoice = 'up' | 'down' | 'mixed';

const METRIC_LABEL: Record<string, string> = {
    gdp: 'national output',
    gdpGrowthRate: 'the growth rate',
    population: 'the population',
    stability: 'political stability',
    eliteSatisfaction: 'elite support',
    militaryPower: 'the army\u2019s standing',
    educationLevel: 'education',
    famineRisk: 'food security',
    internationalRelations: 'foreign relations',
    genderEquality: 'gender equality',
    externalDebt: 'the debt burden',
};

interface PolicyDossierProps {
    proposal: PolicyProposal;
    characters?: Record<CharacterId, CharacterState>;
    advisorInsight: number;
    onSpendInsight: () => void;
    onConfirm: (option: EducationalPolicyOption, prediction: PredictionChoice | null) => void;
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
 * A stable, decorative case number derived from the proposal id — never a
 * real count of anything, so it carries no numeric effect information. Old
 * government files were numbered; this dossier is one.
 */
function fileNumber(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i += 1) {
        hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    }
    return String(100 + (hash % 899));
}

/** Initials for a marginal-note signature — "handwritten" in the margin. */
function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 3);
}

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
    const [openSection, setOpenSection] = useState<string | null>(null);
    const [insightUsed, setInsightUsed] = useState(false);
    const [prediction, setPrediction] = useState<PredictionChoice | null>(null);

    const sponsor = CHARACTERS_BY_ID[proposal.sponsorId];
    const sponsorFaction = FACTIONS_BY_ID[sponsor.factionId];
    const concepts = ECONOMIC_CONCEPTS.filter(concept => proposal.conceptIds.includes(concept.id));
    const sources = SOURCES.filter(source => proposal.sourceIds.includes(source.id));
    const docket = proposal.arcId.replace(/[-_]+/g, ' ').trim();

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

            <div className="dossier-cover edge-lit">
                <div className="dossier-tab" aria-hidden="true">
                    <span className="type-eyebrow dossier-tab-label">{sponsorFaction.shortName}</span>
                </div>

                <div className="dossier-stamp" aria-hidden="true">
                    <span>Cabinet</span>
                    <span>Eyes Only</span>
                </div>

                <p className="dossier-file-ref">
                    File No. {fileNumber(proposal.id)} &middot; Docket: {docket} · Step {proposal.arcStep}
                </p>

                <header className="dossier-header">
                    <div className="dossier-sponsor-row">
                        <Portrait characterId={proposal.sponsorId} size={54} />
                        <p className="dossier-sponsor">
                            Raised by <strong>{sponsor.name}</strong>, {sponsor.title}
                        </p>
                    </div>
                    <h2 className="dossier-title">{proposal.title}</h2>
                    <p className="dossier-brief">{proposal.brief}</p>
                </header>

                <div className="dossier-section">
                    <h3 className="dossier-section-title">Who benefits, who pays</h3>
                    <p className="dossier-stakeholders">{proposal.stakeholderSummary}</p>
                </div>

            {concepts.map((concept, index) => {
                const sectionId = `mechanism-${concept.id}`;
                // Only the first mechanism is open by default; a proposal can carry
                // three concepts, and opening them all buries the decision itself.
                const isOpen = openSection === sectionId || (openSection === null && index === 0);
                return (
                <div key={concept.id} className="dossier-accordion">
                    <button
                        type="button"
                        className="dossier-accordion-head"
                        aria-expanded={isOpen}
                        onClick={() => toggle(sectionId)}
                    >
                        <span>The mechanism · {concept.title}</span>
                        <span aria-hidden="true">{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen && (
                        <div className="dossier-accordion-body mat-paper">
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
                );
            })}

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
                        <div className="dossier-accordion-body mat-paper">
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
                        <div className="dossier-accordion-body mat-paper">
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
                                onClick={() => {
                                    setSelectedId(isSelected ? null : option.id);
                                    setPrediction(null);
                                }}
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
                                                    <Portrait
                                                        characterId={forecast.advisorId}
                                                        size={30}
                                                    />
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
                                                            <span
                                                                className="dossier-forecast-initials"
                                                                aria-hidden="true"
                                                            >
                                                                — {initials(advisor.name)}
                                                            </span>
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

                                    {(() => {
                                        const metric = headlineMetric(option.effects);
                                        if (!metric) return null;
                                        const label = METRIC_LABEL[metric] ?? metric;
                                        return (
                                            <div className="dossier-predict">
                                                <h4 className="dossier-minor-heading">
                                                    Before you commit — what do you expect this to do to{' '}
                                                    {label}?
                                                </h4>
                                                <div
                                                    className="dossier-predict-options"
                                                    role="group"
                                                    aria-label={`Your prediction for ${label}`}
                                                >
                                                    {(
                                                        [
                                                            ['up', '▲ Improve'],
                                                            ['mixed', '◆ Little change'],
                                                            ['down', '▼ Worsen'],
                                                        ] as [PredictionChoice, string][]
                                                    ).map(([value, text]) => (
                                                        <button
                                                            key={value}
                                                            type="button"
                                                            className={`dossier-predict-button${
                                                                prediction === value ? ' is-picked' : ''
                                                            }`}
                                                            aria-pressed={prediction === value}
                                                            onClick={() =>
                                                                setPrediction(
                                                                    prediction === value ? null : value,
                                                                )
                                                            }
                                                        >
                                                            {text}
                                                        </button>
                                                    ))}
                                                </div>
                                                <p className="dossier-predict-note">
                                                    Optional, and never penalised. Your call is checked against
                                                    the debrief.
                                                </p>
                                            </div>
                                        );
                                    })()}

                                    <button
                                        type="button"
                                        className="primary-button dossier-commit"
                                        onClick={() => onConfirm(option, prediction)}
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
            </div>
        </section>
    );
}
