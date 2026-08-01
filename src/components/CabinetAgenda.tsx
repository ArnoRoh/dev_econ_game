import type { CharacterId, CharacterState, ForecastAudit, PolicyDecisionRecord, PolicyProposal } from '../engine/types';
import { advisorRecord } from '../engine/learningLogic';
import { ProposalCard } from './ProposalCard';
import './CabinetAgenda.css';

interface CabinetAgendaProps {
    year: number;
    proposals: PolicyProposal[];
    actionsRemaining: number;
    characters?: Record<CharacterId, CharacterState>;
    decisions: PolicyDecisionRecord[];
    audits: ForecastAudit[];
    onOpen: (proposalId: string) => void;
    onEndSession: () => void;
}

/**
 * The core scarcity of the game: more things demand attention than you have
 * attention to give. Whatever is left on the table when the session ends
 * resolves on its own, and the people who raised it remember.
 */
export function CabinetAgenda({
    year,
    proposals,
    actionsRemaining,
    characters,
    decisions,
    audits,
    onOpen,
    onEndSession,
}: CabinetAgendaProps) {
    const recordFor = (advisorId: CharacterId) => advisorRecord(audits, advisorId);
    const openedArcs = new Set(
        decisions
            .map(decision => proposals.find(proposal => proposal.id === decision.proposalId)?.arcId)
            .filter(Boolean),
    );
    const decidedArcIds = new Set(decisions.map(decision => decision.proposalId));

    return (
        <section className="cabinet-agenda" aria-label={`Cabinet agenda for ${year}`}>
            <header className="cabinet-header">
                <div className="cabinet-header-text">
                    <h2 className="cabinet-title">Cabinet Session · {year}</h2>
                    <p className="cabinet-subtitle">
                        {proposals.length} matters before you. You can take {actionsRemaining} of them.
                    </p>
                </div>
                <div className="cabinet-actions" aria-label={`${actionsRemaining} actions remaining`}>
                    {Array.from({ length: 2 }, (_, index) => (
                        <span
                            key={index}
                            className={`cabinet-action-pip${index < actionsRemaining ? ' is-available' : ''}`}
                            aria-hidden="true"
                        />
                    ))}
                    <span className="cabinet-actions-label">
                        {actionsRemaining} action{actionsRemaining === 1 ? '' : 's'} left
                    </span>
                </div>
            </header>

            {proposals.length === 0 && (
                <p className="cabinet-empty">
                    Nothing has reached the cabinet table this year. The ministries are working through
                    what you have already set in motion.
                </p>
            )}

            <div className="cabinet-grid">
                {proposals.map(proposal => (
                    <ProposalCard
                        key={proposal.id}
                        proposal={proposal}
                        characterState={characters?.[proposal.sponsorId]}
                        record={recordFor(proposal.sponsorId)}
                        isArcContinuation={openedArcs.has(proposal.arcId) && !decidedArcIds.has(proposal.id)}
                        disabled={actionsRemaining <= 0}
                        onOpen={onOpen}
                    />
                ))}
            </div>

            <footer className="cabinet-footer">
                <p className="cabinet-warning">
                    {actionsRemaining > 0
                        ? 'Anything you do not reach will be settled without you.'
                        : 'Your actions are spent. The remaining matters will resolve on their own.'}
                </p>
                <button type="button" className="primary-button" onClick={onEndSession}>
                    {actionsRemaining > 0 ? 'Close the session early' : 'Close the session'}
                </button>
            </footer>
        </section>
    );
}
