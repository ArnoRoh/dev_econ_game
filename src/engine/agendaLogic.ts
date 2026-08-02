import { ALL_POLICY_PROPOSALS } from '../data/arcs/index.ts';
import { yearsToChapters } from '../data/chapters.ts';
import { crisisForChapter } from '../data/crises.ts';
import { applyCharacterMemory, applyFactionEffects } from './factionLogic.ts';
import { applyOption } from './gameLogic.ts';
import { makePromise } from './consequenceLogic.ts';
import type {
    CharacterId,
    EducationalPolicyOption,
    GameState,
    PolicyDecisionRecord,
    PolicyProposal,
    ScheduledConsequence,
} from './types';

export const AGENDA_ACTIONS_PER_TURN = 2;

/** With `third_action` unlocked, an experienced cabinet gets one more. */
export const AGENDA_ACTIONS_UNLOCKED = 3;

/**
 * Sessions before a recurring matter may return to the agenda.
 *
 * This was 14 when a turn was a year. Sessions now cover roughly three years
 * each, so the same fourteen-year interval is five of them — and left at 14 it
 * would have meant standing business could recur at most once in a
 * twenty-five-session campaign, emptying the agenda in the back half exactly as
 * the original comment warned.
 */
export const RECURRENCE_GAP_TURNS = 5;

const getAgendaIds = (state: GameState): string[] => state.agendaProposalIds ?? [];
const getDecisions = (state: GameState): PolicyDecisionRecord[] => state.policyDecisions ?? [];

const isEligible = (proposal: PolicyProposal, state: GameState): boolean => {
    if (proposal.minYear !== undefined && state.year < proposal.minYear) return false;
    if (proposal.maxYear !== undefined && state.year > proposal.maxYear) return false;

    if (proposal.requiredFlags?.some(flag => !state.flags[flag])) return false;
    if (proposal.blockedByFlags?.some(flag => state.flags[flag])) return false;

    // A matter that has already been settled does not return unless authored to.
    // Standing business is authored to: the same structural dispute genuinely
    // does come back around, and without recurrence the cabinet table runs empty
    // roughly two thirds of the way through a seventy-year campaign.
    const priorDecisions = getDecisions(state).filter(decision => decision.proposalId === proposal.id);
    if (priorDecisions.length > 0) {
        if (!proposal.repeatable) return false;

        const lastTurn = Math.max(...priorDecisions.map(decision => decision.turn));
        if (state.turn - lastTurn < RECURRENCE_GAP_TURNS) return false;
    }

    // An arc tells a story in order: a later step cannot reach the table before
    // the step it depends on has been resolved.
    if (!proposal.isGeneric && proposal.arcStep > activeArcStep(proposal, state)) {
        return false;
    }

    return true;
};

export const getEligibleProposals = (proposals: PolicyProposal[], state: GameState): PolicyProposal[] =>
    proposals.filter(proposal => isEligible(proposal, state));

const proposalWasResolvedRecently = (proposalId: string, state: GameState): boolean => {
    const earliestRecentTurn = state.turn - 2;
    return getDecisions(state).some(decision =>
        decision.proposalId === proposalId &&
        decision.turn >= earliestRecentTurn &&
        decision.turn < state.turn,
    );
};

const activeArcStep = (proposal: PolicyProposal, state: GameState): number => {
    const resolvedSteps = getDecisions(state)
        .filter(decision => decision.proposalId !== proposal.id)
        .map(decision => proposalsById.get(decision.proposalId))
        .filter((resolved): resolved is PolicyProposal => resolved?.arcId === proposal.arcId)
        .map(resolved => resolved.arcStep);

    return Math.max(1, ...resolvedSteps) + (resolvedSteps.length ? 1 : 0);
};

const proposalsById = new Map<string, PolicyProposal>(
    ALL_POLICY_PROPOSALS.map(proposal => [proposal.id, proposal]),
);

const priorityFor = (proposal: PolicyProposal, state: GameState): number => {
    const nextStep = activeArcStep(proposal, state);
    const resolvedCount = getDecisions(state).filter(decision => decision.proposalId === proposal.id).length;

    if (proposal.arcStep === nextStep) return 1000;
    if (proposal.arcStep > nextStep) return 500 - proposal.arcStep;
    return Math.max(10, 100 - resolvedCount * 10);
};

/**
 * Select three or four eligible proposals. The injected random source only
 * breaks ties and chooses the agenda size, making seeded simulations repeatable.
 */
export function generateAgenda(
    proposals: PolicyProposal[],
    state: GameState,
    random: () => number = Math.random,
): string[] {
    const eligible = getEligibleProposals(proposals, state);
    const fresh = eligible.filter(proposal => !proposalWasResolvedRecently(proposal.id, state));
    const pool = fresh.length >= 3 ? fresh : eligible;
    const targetSize = pool.length <= 3 ? pool.length : 3 + (random() >= 0.5 ? 1 : 0);

    const ranked = pool
        .map(proposal => ({ proposal, tieBreak: random() }))
        .sort((left, right) => {
            const priorityDifference = priorityFor(right.proposal, state) - priorityFor(left.proposal, state);
            return priorityDifference || left.tieBreak - right.tieBreak;
        });

    // Authored arc steps take precedence; generic business fills what is left,
    // which keeps the agenda full across a campaign far longer than the arcs.
    const authored = ranked.filter(entry => !entry.proposal.isGeneric);
    const generic = ranked.filter(entry => entry.proposal.isGeneric);

    // A cabinet table should sound like several people, not one minister with a
    // long list. Take proposals in rank order but skip a sponsor already on the
    // agenda, then relax the rule to fill any slots that remain. Arc steps are
    // subject to the same pass — two live steps can share a sponsor, and seeing
    // the same face twice reads as a bug.
    const chosen: typeof ranked = [];
    const sponsors = new Set<CharacterId>();

    for (const pass of [authored, generic]) {
        for (const entry of pass) {
            if (chosen.length >= targetSize) break;
            if (sponsors.has(entry.proposal.sponsorId)) continue;
            chosen.push(entry);
            sponsors.add(entry.proposal.sponsorId);
        }
    }

    for (const entry of [...authored, ...generic]) {
        if (chosen.length >= targetSize) break;
        if (chosen.includes(entry)) continue;
        chosen.push(entry);
    }

    return chosen.slice(0, targetSize).map(({ proposal }) => proposal.id);
}

export function startAgendaTurn(
    state: GameState,
    proposals: PolicyProposal[] = ALL_POLICY_PROPOSALS,
    random: () => number = Math.random,
): GameState {
    // A crisis session has no agenda. The world has already decided what this
    // cabinet is discussing, and the whole sitting goes to it.
    const crisis = crisisForChapter(state.turn);
    if (crisis && !(state.resolvedCrisisIds ?? []).includes(crisis.id)) {
        return {
            ...state,
            agendaProposalIds: [],
            actionsRemaining: 0,
            activeCrisisId: crisis.id,
        };
    }

    const actions = (state.unlockedIds ?? []).includes('third_action')
        ? AGENDA_ACTIONS_UNLOCKED
        : AGENDA_ACTIONS_PER_TURN;

    return {
        ...state,
        agendaProposalIds: generateAgenda(proposals, state, random),
        actionsRemaining: actions,
        activeCrisisId: null,
    };
}

/** Select is deliberately free; confirmation is the action-consuming transition. */
export const selectProposal = (state: GameState, proposalId: string): string | null =>
    getAgendaIds(state).includes(proposalId) ? proposalId : null;

const makeDecisionId = (state: GameState, proposal: PolicyProposal, status: PolicyDecisionRecord['status']): string =>
    `${state.turn}-${proposal.id}-${status}-${getDecisions(state).length}`;

const scheduleConsequences = (
    state: GameState,
    decisionId: string,
    specs: PolicyProposal['options'][number]['delayedConsequences'],
): ScheduledConsequence[] => specs.map(spec => ({
    id: `${decisionId}-${spec.id}`,
    sourceDecisionId: decisionId,
    // Authored delays are in years — the corpus predates multi-year sessions —
    // so they are converted to sessions here rather than rewritten in `src/data`.
    dueTurn: state.turn + yearsToChapters(spec.delayTurns),
    spec,
}));

const appendDecision = (
    state: GameState,
    proposal: PolicyProposal,
    record: PolicyDecisionRecord,
    scheduled: ScheduledConsequence[],
): GameState => ({
    ...state,
    agendaProposalIds: getAgendaIds(state).filter(id => id !== proposal.id),
    policyDecisions: [...getDecisions(state), record],
    scheduledConsequences: [...(state.scheduledConsequences ?? []), ...scheduled],
    chronicle: [
        ...state.chronicle,
        {
            id: record.id,
            year: state.year,
            category: 'policy' as const,
            title: proposal.title,
            decision: record.optionText ?? 'Proposal ignored',
            effects: record.immediateEffects,
        },
    ],
});

export function confirmProposal(
    state: GameState,
    proposal: PolicyProposal,
    optionOrId: EducationalPolicyOption | string,
): GameState {
    if (!getAgendaIds(state).includes(proposal.id) || (state.actionsRemaining ?? 0) <= 0) return state;

    const option = typeof optionOrId === 'string'
        ? proposal.options.find(candidate => candidate.id === optionOrId)
        : optionOrId;
    if (!option || !proposal.options.some(candidate => candidate.id === option.id)) return state;

    const decisionId = makeDecisionId(state, proposal, 'chosen');
    const scheduled = scheduleConsequences(state, decisionId, option.delayedConsequences);
    let nextState = applyOption(state, { text: option.text, effects: option.effects, setFlags: option.setFlags });
    nextState = applyFactionEffects(nextState, option.factionEffects);
    nextState = applyCharacterMemory(nextState, proposal.sponsorId, `Turn ${state.turn}: ${option.text}`);
    nextState = {
        ...nextState,
        treasury: Math.max(0, nextState.treasury + (option.treasuryEffect ?? 0)),
        actionsRemaining: Math.max(0, (state.actionsRemaining ?? 0) - 1),
    };

    // A promise is recorded the moment it is made, and judged years later.
    if (option.createsPromise) {
        const promise = option.createsPromise;
        nextState = makePromise(nextState, {
            id: `${decisionId}-${promise.id}`,
            madeTurn: state.turn,
            factionId: promise.factionId,
            description: promise.description,
            deadlineTurn: state.turn + yearsToChapters(promise.deadlineTurns),
            completionFlag: promise.completionFlag,
        });
    }

    const record: PolicyDecisionRecord = {
        id: decisionId,
        turn: state.turn,
        year: state.year,
        proposalId: proposal.id,
        proposalTitle: proposal.title,
        sponsorId: proposal.sponsorId,
        status: 'chosen',
        optionId: option.id,
        optionText: option.text,
        immediateEffects: option.effects,
        treasuryEffect: option.treasuryEffect,
        factionEffects: option.factionEffects,
        conceptIds: option.conceptIds,
        sourceIds: option.sourceIds,
        scheduledConsequenceIds: scheduled.map(consequence => consequence.id),
        resolvedConsequenceIds: [],
    };

    // Park the authored forecasts so they can be scored once an outcome is
    // observable. This lives here rather than in the UI because
    // `resolveCrisis` already does it in the engine, and because audits created
    // only on the React path meant the balance simulations never exercised the
    // calibration layer at all — the one place a systematic advisor bias would
    // show up as a measurable effect.
    nextState = {
        ...nextState,
        forecastAudits: [
            ...(nextState.forecastAudits ?? []),
            ...option.forecasts.map(forecast => ({
                decisionId,
                advisorId: forecast.advisorId,
                summary: forecast.summary,
                predictedDirection: forecast.predictedDirection,
                confidence: forecast.confidence,
                affectedMetric: forecast.affectedMetric,
            })),
        ],
    };

    return appendDecision(nextState, proposal, record, scheduled);
}

export function rejectProposal(state: GameState, proposal: PolicyProposal): GameState {
    if (!getAgendaIds(state).includes(proposal.id)) return state;

    const decisionId = makeDecisionId(state, proposal, 'rejected');
    const record: PolicyDecisionRecord = {
        id: decisionId,
        turn: state.turn,
        year: state.year,
        proposalId: proposal.id,
        proposalTitle: proposal.title,
        sponsorId: proposal.sponsorId,
        status: 'rejected',
        immediateEffects: {},
        factionEffects: [],
        conceptIds: proposal.conceptIds,
        sourceIds: proposal.sourceIds,
        scheduledConsequenceIds: [],
        resolvedConsequenceIds: [],
    };

    return appendDecision(state, proposal, record, []);
}

export function ignoreProposal(state: GameState, proposal: PolicyProposal): GameState {
    if (!getAgendaIds(state).includes(proposal.id)) return state;

    const decisionId = makeDecisionId(state, proposal, 'ignored');
    const scheduled = scheduleConsequences(state, decisionId, [proposal.ignoreOutcome]);
    const record: PolicyDecisionRecord = {
        id: decisionId,
        turn: state.turn,
        year: state.year,
        proposalId: proposal.id,
        proposalTitle: proposal.title,
        sponsorId: proposal.sponsorId,
        status: 'ignored',
        immediateEffects: {},
        factionEffects: proposal.ignoreOutcome.factionEffects ?? [],
        conceptIds: proposal.ignoreOutcome.conceptIds,
        sourceIds: proposal.sourceIds,
        scheduledConsequenceIds: scheduled.map(consequence => consequence.id),
        resolvedConsequenceIds: [],
    };

    return appendDecision(state, proposal, record, scheduled);
}

export function ignoreRemainingProposals(
    state: GameState,
    proposals: PolicyProposal[] = ALL_POLICY_PROPOSALS,
): GameState {
    const proposalMap = new Map(proposals.map(proposal => [proposal.id, proposal]));
    let nextState = state;

    for (const proposalId of getAgendaIds(state)) {
        const proposal = proposalMap.get(proposalId);
        if (proposal) nextState = ignoreProposal(nextState, proposal);
    }

    return {
        ...nextState,
        agendaProposalIds: [],
        actionsRemaining: 0,
    };
}

export const resolveIgnoredProposals = ignoreRemainingProposals;

export const finishAgendaTurn = (state: GameState): GameState => ({
    ...state,
    agendaProposalIds: [],
    actionsRemaining: 0,
});
