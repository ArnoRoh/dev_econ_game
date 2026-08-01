/**
 * Seeded balance simulation for the cabinet agenda loop.
 *
 * The older simulate-balance.mjs exercises the legacy one-event-per-year path.
 * This one drives the loop the game actually plays: an agenda of three or four
 * proposals, two actions, automatic resolution of whatever is left, and the
 * delayed consequences those choices schedule.
 *
 * The gap between deliberate and careless play is the thing to preserve. If
 * careless play survives to 2030, the political model has no teeth; if
 * deliberate play cannot reach the 1970s, the loop is unplayable.
 */
import {
    advanceTurn,
    checkGameOver,
    createInitialState,
} from '../src/engine/gameLogic.ts';
import {
    confirmProposal,
    ignoreRemainingProposals,
    startAgendaTurn,
} from '../src/engine/agendaLogic.ts';
import { driftFactions } from '../src/engine/factionLogic.ts';
import { resolveDueConsequences, resolveDuePromises } from '../src/engine/consequenceLogic.ts';
import { ALL_POLICY_PROPOSALS } from '../src/data/arcs/index.ts';
import { ARTIFACTS } from '../src/data/artifacts.ts';
import { DIPLOMATIC_PARTNERS } from '../src/data/diplomacy.ts';
import { NATIONAL_MISSIONS } from '../src/data/missions.ts';
import { DEVELOPMENT_PROJECTS } from '../src/data/projects.ts';

const RUNS = Number(process.argv[2] ?? 200);
const ACTIONS_PER_TURN = 2;

const seededRandom = seed => {
    let value = seed >>> 0;
    return () => {
        value = (value * 1664525 + 1013904223) >>> 0;
        return value / 4294967296;
    };
};

const PROPOSALS_BY_ID = new Map(ALL_POLICY_PROPOSALS.map(proposal => [proposal.id, proposal]));

/** How a cabinet that wants to survive reads an option. */
const optionScore = (option, state) => {
    const effects = option.effects ?? {};
    const factionPull = (option.factionEffects ?? []).reduce((sum, effect) => {
        const current = state.factions?.[effect.factionId]?.support ?? 50;
        // Losing support you cannot spare is worse than losing support you can.
        const weight = current < 40 ? 2.2 : 1.0;
        return sum + (effect.support ?? 0) * weight - (effect.radicalization ?? 0) * 1.5;
    }, 0);

    return (
        (effects.stability ?? 0) * 2.4 +
        (effects.eliteSatisfaction ?? 0) * 1.4 +
        (effects.militaryPower ?? 0) * (state.country.militaryPower < 25 ? 2 : 0.6) +
        (effects.educationLevel ?? 0) * 1.1 -
        (effects.famineRisk ?? 0) * 2.4 +
        (effects.gdpGrowthRate ?? 0) * 16 +
        (effects.gdp ?? 0) * 0.04 -
        (effects.externalDebt ?? 0) * 0.12 +
        (effects.internationalRelations ?? 0) * 0.25 +
        (effects.genderEquality ?? 0) * 0.35 +
        (option.treasuryEffect ?? 0) * 0.05 +
        factionPull * 1.6
    );
};

const STRATEGIES = {
    deliberate: (proposals, state) => {
        // Rank proposals by the best option each offers, then take the best two.
        const ranked = proposals
            .map(proposal => {
                const best = proposal.options.reduce(
                    (chosen, option) =>
                        optionScore(option, state) > optionScore(chosen, state) ? option : chosen,
                    proposal.options[0],
                );
                return { proposal, option: best, score: optionScore(best, state) };
            })
            .sort((left, right) => right.score - left.score);
        return ranked.slice(0, ACTIONS_PER_TURN);
    },
    careless: (proposals, state, random) =>
        proposals.slice(0, ACTIONS_PER_TURN).map(proposal => ({
            proposal,
            option: proposal.options[Math.floor(random() * proposal.options.length)],
            score: 0,
            state,
        })),
    /** The pathological case: always take the first option offered. */
    firstListed: (proposals, state) =>
        proposals.slice(0, ACTIONS_PER_TURN).map(proposal => ({
            proposal,
            option: proposal.options[0],
            score: 0,
            state,
        })),
};

function runOnce(strategyName, seed) {
    const random = seededRandom(seed);
    const artifacts = [ARTIFACTS.find(a => a.id === 'coastal_access'), ARTIFACTS.find(a => a.id === 'fertile_land')]
        .filter(Boolean);

    let state = createInitialState(artifacts, 'Testland', NATIONAL_MISSIONS[0].id, DIPLOMATIC_PARTNERS);
    state = startAgendaTurn(state, ALL_POLICY_PROPOSALS, random);

    let guard = 0;
    while (!state.gameOver && guard++ < 200) {
        const agenda = (state.agendaProposalIds ?? [])
            .map(id => PROPOSALS_BY_ID.get(id))
            .filter(Boolean);

        for (const pick of STRATEGIES[strategyName](agenda, state, random)) {
            if ((state.actionsRemaining ?? 0) <= 0) break;
            if (!pick?.option) continue;
            state = confirmProposal(state, pick.proposal, pick.option);
        }

        state = ignoreRemainingProposals(state, ALL_POLICY_PROPOSALS);

        state = checkGameOver(state);
        if (state.gameOver) break;

        state = advanceTurn(state, DEVELOPMENT_PROJECTS, DIPLOMATIC_PARTNERS);
        state = driftFactions(state);
        state = resolveDueConsequences(state);
        state = resolveDuePromises(state);

        state = checkGameOver(state);
        if (state.gameOver) break;

        state = startAgendaTurn(state, ALL_POLICY_PROPOSALS, random);
    }

    return state;
}

const summarise = (label, results) => {
    const reached = year => ((results.filter(r => r.year >= year).length / results.length) * 100).toFixed(1);
    const reasons = results.reduce((tally, result) => {
        const key = result.gameOverReason ?? 'unresolved';
        tally[key] = (tally[key] ?? 0) + 1;
        return tally;
    }, {});

    console.log(`\n${label}`);
    console.log(`Average end year: ${(results.reduce((s, r) => s + r.year, 0) / results.length).toFixed(1)}`);
    console.log(`Reach 1970: ${reached(1970)}%`);
    console.log(`Reach 1990: ${reached(1990)}%`);
    console.log(`Reach 2010: ${reached(2010)}%`);
    console.log(`Complete 2030: ${reached(2030)}%`);
    console.log(
        `Decisions taken (avg): ${(
            results.reduce((s, r) => s + (r.policyDecisions ?? []).filter(d => d.status === 'chosen').length, 0) /
            results.length
        ).toFixed(1)}`,
    );
    console.log(
        `Consequences landed (avg): ${(
            results.reduce((s, r) => s + (r.newspaper ?? []).length, 0) / results.length
        ).toFixed(1)}`,
    );
    console.log(
        'End states: ' +
            Object.entries(reasons)
                .sort((a, b) => b[1] - a[1])
                .map(([reason, count]) => `${reason} ${count}`)
                .join(' · '),
    );

    return { reached2030: Number(reached(2030)), averageYear: results.reduce((s, r) => s + r.year, 0) / results.length };
};

console.log(`Seeded agenda simulation: ${RUNS} runs per strategy`);
console.log(`Proposal pool: ${ALL_POLICY_PROPOSALS.length}`);

const deliberate = summarise(
    'Deliberate cabinet',
    Array.from({ length: RUNS }, (_, i) => runOnce('deliberate', i + 1)),
);
const careless = summarise(
    'Careless cabinet (random option)',
    Array.from({ length: RUNS }, (_, i) => runOnce('careless', i + 5000)),
);
summarise(
    'Pathological cabinet (always first option)',
    Array.from({ length: RUNS }, (_, i) => runOnce('firstListed', i + 9000)),
);

// Guard rails. These are wide on purpose: they catch a loop that has become
// unplayable or trivially winnable, not small balance drift.
const failures = [];
if (deliberate.reached2030 < 25) {
    failures.push(`Deliberate play completes 2030 only ${deliberate.reached2030}% of the time (want >= 25%).`);
}
if (careless.reached2030 > deliberate.reached2030) {
    failures.push('Careless play outlasts deliberate play — the political model is not rewarding attention.');
}
if (careless.averageYear > 2020) {
    failures.push(`Careless play averages ${careless.averageYear.toFixed(1)} — collapse is too forgiving.`);
}

if (failures.length) {
    console.error('\nAgenda balance check FAILED:');
    failures.forEach(failure => console.error(` - ${failure}`));
    process.exit(1);
}

console.log('\nAgenda balance within accepted bands.');
