import type { Artifact, NationalMission } from '../engine/types';
import './SetupScreen.css';

interface SetupScreenProps {
    artifacts: Artifact[];
    selectedArtifacts: Artifact[];
    onToggleArtifact: (artifact: Artifact) => void;
    missions: NationalMission[];
    selectedMissionId: string | null;
    onSelectMission: (missionId: string) => void;
    pointsRemaining: number;
    pointsBudget: number;
    canRatify: boolean;
    onRatify: () => void;
    hasActiveSave: boolean;
    onContinue: () => void;
}

/** A staggered entrance, capped so a long list of clauses doesn't crawl in. */
const cardDelay = (index: number) => `${Math.min(index * 26, 260)}ms`;

/**
 * The constitutional convention. Two decisions before the first year: the
 * structural conditions you inherit, and what you are trying to achieve.
 *
 * Styled as the document itself — a paper charter laid on the desk, each
 * choice a clause you ratify. Selecting a clause strikes a small brass stamp
 * into its corner, echoing the seal on the title screen.
 *
 * Negative-cost traits are drawbacks that buy you budget, so the cost badge
 * reads as a credit rather than a price — that inversion is the whole point of
 * the point-buy and needs to be visible at a glance.
 */
export function SetupScreen({
    artifacts,
    selectedArtifacts,
    onToggleArtifact,
    missions,
    selectedMissionId,
    onSelectMission,
    pointsRemaining,
    pointsBudget,
    canRatify,
    onRatify,
    hasActiveSave,
    onContinue,
}: SetupScreenProps) {
    const selectedIds = new Set(selectedArtifacts.map(artifact => artifact.id));
    const overspent = pointsRemaining < 0;

    return (
        <div className="setup mat-vignette">
            <div className="setup-veil" aria-hidden="true" />

            <div className="setup-inner">
                {hasActiveSave && (
                    <button type="button" className="setup-resume" onClick={onContinue}>
                        Resume your republic
                    </button>
                )}

                <div className="setup-document mat-paper mat-grain edge-lit">
                    <div className="setup-seal" aria-hidden="true">
                        <svg className="setup-seal-mark" viewBox="0 0 40 40" role="presentation">
                            <circle className="setup-seal-ring-outer" cx="20" cy="20" r="17" />
                            <circle className="setup-seal-ring-ticks" cx="20" cy="20" r="12.5" />
                            <circle className="setup-seal-dot" cx="20" cy="20" r="3" />
                        </svg>
                    </div>

                    <header className="setup-header">
                        <p className="setup-kicker type-eyebrow">Constitutional Convention · 1960</p>
                        <h1 className="setup-title type-letterpress">Post-Colonial Republic</h1>
                        <p className="setup-lede">
                            The flag is down and the administrators have gone. Before the first cabinet
                            sits, settle what this country starts with — and what it is for.
                        </p>
                    </header>

                    <span className="setup-rule rule-double" aria-hidden="true" />

                    <section className="setup-section" aria-labelledby="setup-conditions">
                        <div className="setup-section-head">
                            <h2 className="setup-section-title" id="setup-conditions">
                                Starting conditions
                            </h2>
                            <p
                                className={`setup-budget${overspent ? ' is-over' : ''}`}
                                role="status"
                            >
                                <span className="setup-budget-value">{pointsRemaining}</span>
                                <span className="setup-budget-label">
                                    of {pointsBudget} constitution points
                                </span>
                            </p>
                        </div>
                        <p className="setup-hint">
                            Advantages cost points. Handicaps refund them — take a weakness to afford a strength.
                        </p>

                        <ul className="setup-grid">
                            {artifacts.map((artifact, index) => {
                                const isSelected = selectedIds.has(artifact.id);
                                const cost = artifact.pointCost || 0;
                                const isCredit = cost < 0;

                                return (
                                    <li key={artifact.id} style={{ animationDelay: cardDelay(index) }}>
                                        <button
                                            type="button"
                                            className={`setup-card${isSelected ? ' is-selected' : ''}`}
                                            aria-pressed={isSelected}
                                            onClick={() => onToggleArtifact(artifact)}
                                        >
                                            {isSelected && <span className="setup-stamp" aria-hidden="true" />}
                                            <span
                                                className={`setup-cost${isCredit ? ' is-credit' : ''}`}
                                                aria-label={
                                                    isCredit
                                                        ? `Refunds ${Math.abs(cost)} points`
                                                        : `Costs ${cost} points`
                                                }
                                            >
                                                {isCredit ? `+${Math.abs(cost)}` : `−${cost}`}
                                            </span>
                                            <span className="setup-card-name">{artifact.name}</span>
                                            <span className="setup-card-desc">{artifact.description}</span>
                                            {artifact.tags && artifact.tags.length > 0 && (
                                                <span className="setup-card-tags">
                                                    {artifact.tags.slice(0, 3).join(' · ')}
                                                </span>
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>

                    <span className="setup-rule rule-double" aria-hidden="true" />

                    <section className="setup-section" aria-labelledby="setup-mission">
                        <div className="setup-section-head">
                            <h2 className="setup-section-title" id="setup-mission">
                                National mission
                            </h2>
                        </div>
                        <p className="setup-hint">
                            What history should judge you on. It sets your bonus objectives, not your options.
                        </p>

                        <ul className="setup-missions">
                            {missions.map((mission, index) => {
                                const isSelected = selectedMissionId === mission.id;
                                return (
                                    <li key={mission.id} style={{ animationDelay: cardDelay(index) }}>
                                        <button
                                            type="button"
                                            className={`setup-mission${isSelected ? ' is-selected' : ''}`}
                                            aria-pressed={isSelected}
                                            onClick={() => onSelectMission(mission.id)}
                                        >
                                            {isSelected && <span className="setup-stamp" aria-hidden="true" />}
                                            <span className="setup-mission-name">{mission.name}</span>
                                            <span className="setup-mission-desc">{mission.description}</span>
                                            <span className="setup-mission-goals">
                                                {mission.goals.map(goal => goal.label).join(' · ')}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>

                    <footer className="setup-footer">
                        <button
                            type="button"
                            className="primary-button setup-ratify"
                            onClick={onRatify}
                            disabled={!canRatify}
                        >
                            Ratify the constitution
                        </button>
                        {!canRatify && (
                            <p className="setup-blocked">
                                {overspent
                                    ? 'You are over budget. Drop an advantage or accept a handicap.'
                                    : selectedArtifacts.length === 0
                                      ? 'Choose at least one starting condition.'
                                      : 'Choose a national mission.'}
                            </p>
                        )}
                    </footer>
                </div>
            </div>
        </div>
    );
}
