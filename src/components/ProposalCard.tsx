import type { CharacterState, PolicyProposal } from '../engine/types';
import { CHARACTERS_BY_ID } from '../data/characters';
import { FACTIONS_BY_ID } from '../data/factions';
import { Portrait } from './Portrait';
import { Emblem, emblemForTags } from './Emblem';
import type { EmblemKind } from './Emblem';

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

/** Authored arcs carry concepts rather than tags; both resolve to a subject. */
const CONCEPT_EMBLEM: Record<string, EmblemKind> = {
    land_tenure: 'agriculture',
    green_revolution: 'agriculture',
    import_substitution: 'industry',
    infant_industry: 'industry',
    export_orientation: 'trade',
    labor_standards: 'labour',
    dutch_disease: 'finance',
    sovereign_wealth_fund: 'finance',
    resource_curse: 'resources',
};

const emblemFor = (proposal: PolicyProposal): EmblemKind => {
    if (proposal.tags?.length) return emblemForTags(proposal.tags);
    for (const concept of proposal.conceptIds) {
        const kind = CONCEPT_EMBLEM[concept];
        if (kind) return kind;
    }
    return 'generic';
};

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
                <Portrait characterId={proposal.sponsorId} size={42} />
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

            <h3 className="proposal-title">
                <span className="proposal-emblem" aria-hidden="true">
                    <Emblem kind={emblemFor(proposal)} size={18} />
                </span>
                {proposal.title}
            </h3>
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
