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
    checkGameOver,
    createInitialState,
} from '../src/engine/gameLogic.ts';
import { runChapter } from '../src/engine/chapterLogic.ts';
import { activeCrisis, resolveCrisis } from '../src/engine/crisisLogic.ts';
import {
    confirmProposal,
    ignoreRemainingProposals,
    startAgendaTurn,
} from '../src/engine/agendaLogic.ts';
import { buildProgramme } from '../src/engine/provinceLogic.ts';
import { PROGRAMMES, isProgrammeAvailable } from '../src/data/programmes.ts';
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

/**
 * How each cabinet spends the provincial development budget. This matters to the
 * balance bands because restive provinces and a widening regional gap now drag on
 * national stability, so a cabinet that ignores the map is not playing the same
 * game as one that reads it.
 */
const PROVINCE_POLICY = {
    // Attend to whoever is furthest behind, and prefer programmes that also calm.
    deliberate: (state, random) => {
        const provinces = state.provinces ?? [];
        if (provinces.length === 0) return state;
        const target = provinces.reduce((worst, province) => (
            province.development < worst.development ? province : worst
        ));
        const preference = ['irrigation', 'schools', 'roads'];
        const programme = preference
            .map(id => PROGRAMMES.find(p => p.id === id))
            .find(p => p && isProgrammeAvailable(p, target))
            ?? PROGRAMMES[Math.floor(random() * PROGRAMMES.length)];
        return buildProgramme(state, target.id, programme.id, programme.cost);
    },
    // Spend it wherever, on whatever is available.
    careless: (state, random) => {
        const provinces = state.provinces ?? [];
        if (provinces.length === 0) return state;
        const target = provinces[Math.floor(random() * provinces.length)];
        const options = PROGRAMMES.filter(p => isProgrammeAvailable(p, target));
        if (options.length === 0) return state;
        const programme = options[Math.floor(random() * options.length)];
        return buildProgramme(state, target.id, programme.id, programme.cost);
    },
    // The pathological case: never look at the map at all.
    firstListed: state => state,
};

/**
 * Spend the session's development budget on the map.
 *
 * Ticking, pressure and revenue used to live here too; they now run inside
 * `runChapter`, which is the same code the game uses. All that is left for the
 * simulation to decide is where the money goes — which is the only part that
 * was ever a strategy question.
 */
function spendProvinceBudget(state, strategyName, random) {
    let next = state;

    let guard = 0;
    while ((next.provinceBudget ?? 0) >= 10 && guard++ < 20) {
        const spent = PROVINCE_POLICY[strategyName](next, random);
        if (spent === next) break; // policy declined to spend; stop looping
        next = spent;
    }

    return next;
}

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
    while (!state.gameOver && guard++ < 60) {
        const crisis = activeCrisis(state);

        if (crisis) {
            // A crisis takes the whole sitting. Each cabinet answers it the same
            // way it answers everything else, so the bands still measure the gap
            // between reading the situation and not.
            const choice = strategyName === 'deliberate'
                ? crisis.options.reduce(
                    (best, option) => (optionScore(option, state) > optionScore(best, state) ? option : best),
                    crisis.options[0],
                )
                : strategyName === 'careless'
                    ? crisis.options[Math.floor(random() * crisis.options.length)]
                    : crisis.options[0];

            state = resolveCrisis(state, crisis, choice);
        } else {
            const agenda = (state.agendaProposalIds ?? [])
                .map(id => PROPOSALS_BY_ID.get(id))
                .filter(Boolean);

            for (const pick of STRATEGIES[strategyName](agenda, state, random)) {
                if ((state.actionsRemaining ?? 0) <= 0) break;
                if (!pick?.option) continue;
                state = confirmProposal(state, pick.proposal, pick.option);
            }

            state = ignoreRemainingProposals(state, ALL_POLICY_PROPOSALS);
        }

        state = checkGameOver(state);
        if (state.gameOver) break;

        state = spendProvinceBudget(state, strategyName, random);

        // The session's years, run through the same orchestrator the game uses.
        state = runChapter(state, DEVELOPMENT_PROJECTS, DIPLOMATIC_PARTNERS).state;
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
