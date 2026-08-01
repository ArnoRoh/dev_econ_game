import type { CharacterState, PolicyProposal } from '../engine/types';
import { CHARACTERS_BY_ID } from '../data/characters';
import { FACTIONS_BY_ID } from '../data/factions';

interface ProposalCardProps {
    proposal: PolicyProposal;
    characterState?: CharacterState;
    /** Running tally of how often this sponsor's forecasts have proved right. */
    record?: { right: number; judged: number };
    /** Marks the next live step of an arc the player has already started. */
    isArcContinuation: boolean;
    disabled: boolean;
    onOpen: (proposalId: string) => void;
}

const initialsOf = (name: string): string =>
    name
        .split(' ')
        .map(part => part[0])
        .slice(0, 2)
        .join('');

/**
 * A proposal is always attached to a person. The card leads with who is asking
 * and how much you trust them, because that is the judgement the player is
 * actually being asked to make.
 */
export function ProposalCard({
    proposal,
    characterState,
    record,
    isArcContinuation,
    disabled,
    onOpen,
}: ProposalCardProps) {
    const sponsor = CHARACTERS_BY_ID[proposal.sponsorId];
    const faction = FACTIONS_BY_ID[sponsor.factionId];
    const trust = characterState?.trust ?? 50;

    return (
        <article className={`proposal-card${disabled ? ' is-disabled' : ''}`}>
            {isArcContinuation && (
                <span className="proposal-flag">Continues a matter you opened</span>
            )}

            <header className="proposal-sponsor">
                <span className="proposal-avatar" aria-hidden="true">
                    {initialsOf(sponsor.name)}
                </span>
                <span className="proposal-sponsor-text">
                    <strong>{sponsor.name}</strong>
                    <span className="proposal-sponsor-title">{sponsor.title}</span>
                    <span className="proposal-sponsor-faction">{faction.shortName}</span>
                </span>
                <span
                    className="proposal-trust"
                    title={`Your trust in ${sponsor.name}: ${Math.round(trust)} of 100`}
                >
                    <span className="proposal-trust-bar">
                        <span className="proposal-trust-fill" style={{ width: `${trust}%` }} />
                    </span>
                    <span className="proposal-trust-label">trust {Math.round(trust)}</span>
                </span>
            </header>

            {record && record.judged >= 2 && (
                <p className="proposal-record">
                    Forecasts right {record.right} of {record.judged}
                </p>
            )}

            <h3 className="proposal-title">{proposal.title}</h3>
            <p className="proposal-brief">{proposal.brief}</p>

            <button
                type="button"
                className="proposal-open"
                onClick={() => onOpen(proposal.id)}
                disabled={disabled}
            >
                {disabled ? 'No actions remaining' : 'Open the dossier'}
            </button>
        </article>
    );
}
