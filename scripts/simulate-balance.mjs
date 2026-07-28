import {
    advanceTurn,
    applyOption,
    buildProject,
    checkGameOver,
    createInitialState,
    deferDevelopmentPlan,
    issueDevelopmentBonds,
    selectWeightedEvent,
    signDiplomaticPact,
} from '../src/engine/gameLogic.ts';
import { ARTIFACTS } from '../src/data/artifacts.ts';
import { DIPLOMATIC_PARTNERS } from '../src/data/diplomacy.ts';
import { EVENTS } from '../src/data/events.ts';
import { NATIONAL_MISSIONS } from '../src/data/missions.ts';
import { DEVELOPMENT_PROJECTS } from '../src/data/projects.ts';

const RUNS = Number(process.argv[2] ?? 500);

const seededRandom = seed => {
    let value = seed >>> 0;
    return () => {
        value = (value * 1664525 + 1013904223) >>> 0;
        return value / 4294967296;
    };
};

const optionScore = (option, state, missionId) => {
    const effects = option.effects;
    let score =
        (effects.stability ?? 0) * 2.4 +
        (effects.eliteSatisfaction ?? 0) * 1.4 +
        (effects.militaryPower ?? 0) * (state.country.militaryPower < 25 ? 2 : 0.6) +
        (effects.educationLevel ?? 0) * 1.1 -
        (effects.famineRisk ?? 0) * 2.4 +
        (effects.gdpGrowthRate ?? 0) * 16 +
        (effects.gdp ?? 0) * 0.04 -
        (effects.externalDebt ?? 0) * 0.12 +
        (effects.internationalRelations ?? 0) * 0.25 +
        (effects.genderEquality ?? 0) * 0.35;

    if (missionId === 'prosperity') score += (effects.gdpGrowthRate ?? 0) * 10 + (effects.gdp ?? 0) * 0.03;
    if (missionId === 'human_development') score += (effects.educationLevel ?? 0) * 1.4 + (effects.genderEquality ?? 0) * 1.1 - (effects.famineRisk ?? 0);
    if (missionId === 'secure_republic') score += (effects.stability ?? 0) * 1.2 + (effects.militaryPower ?? 0) + (effects.internationalRelations ?? 0) * 0.4;

    return score;
};

const projectOrder = {
    prosperity: ['industry', 'transport', 'universities', 'irrigation', 'diplomacy', 'defence'],
    human_development: ['universities', 'irrigation', 'transport', 'diplomacy', 'industry', 'defence'],
    secure_republic: ['defence', 'transport', 'diplomacy', 'irrigation', 'universities', 'industry'],
};

const partnerByMission = {
    prosperity: 'coastal_league',
    human_development: 'southern_republic',
    secure_republic: 'highland_union',
};

const chooseProject = (state, missionId) => projectOrder[missionId]
    .map(id => DEVELOPMENT_PROJECTS.find(project => project.id === id))
    .find(project => project && (state.projectLevels[project.id] ?? 0) < project.maxLevel && state.treasury >= project.treasuryCost);

const simulate = (seed, strategy) => {
    const random = seededRandom(seed);
    const originalRandom = Math.random;
    Math.random = random;

    const mission = NATIONAL_MISSIONS[seed % NATIONAL_MISSIONS.length];
    const artifact = ARTIFACTS[seed % ARTIFACTS.length];
    let state = createInitialState([artifact], `Simulation ${seed}`, mission.id, DIPLOMATIC_PARTNERS);

    while (!state.gameOver && state.year < 2030) {
        state = checkGameOver(state);
        if (state.gameOver) break;

        state = advanceTurn(state, DEVELOPMENT_PROJECTS, DIPLOMATIC_PARTNERS);
        state = checkGameOver(state);
        if (state.gameOver) break;

        const diplomacyDue = state.year >= 1965 && (state.year - 1965) % 10 === 0 && state.lastDiplomacyYear !== state.year;
        if (diplomacyDue) {
            const partner = DIPLOMATIC_PARTNERS.find(item => item.id === partnerByMission[mission.id]);
            state = signDiplomaticPact(state, partner);
        }

        const projectDue = state.year % 5 === 0 && state.lastProjectYear !== state.year;
        if (projectDue) {
            let project = chooseProject(state, mission.id);
            if (!project && state.lastBondYear !== state.year) {
                state = issueDevelopmentBonds(state);
                project = chooseProject(state, mission.id);
            }
            state = project ? buildProject(state, project) : deferDevelopmentPlan(state);
        }

        const event = selectWeightedEvent(EVENTS, state);
        if (event) {
            state = { ...state, recentEventIds: [...state.recentEventIds, event.id].slice(-10) };
            const option = strategy === 'smart'
                ? [...event.options].sort((a, b) => optionScore(b, state, mission.id) - optionScore(a, state, mission.id))[0]
                : event.options[Math.floor(random() * event.options.length)];
            state = applyOption(state, option);
            state = checkGameOver(state);
        }
    }

    Math.random = originalRandom;
    return state;
};

const summarize = (label, results) => {
    const survived = year => results.filter(state => state.year >= year).length / results.length;
    const completed = results.filter(state => state.gameOverReason?.startsWith('Term Limit Reached')).length;
    const averageEndYear = results.reduce((sum, state) => sum + state.year, 0) / results.length;
    const reasons = Object.entries(results.reduce((counts, state) => {
        const reason = state.gameOverReason ?? 'Active';
        counts[reason] = (counts[reason] ?? 0) + 1;
        return counts;
    }, {})).sort((a, b) => b[1] - a[1]);

    console.log(`\n${label}`);
    console.log(`Average end year: ${averageEndYear.toFixed(1)}`);
    console.log(`Reach 1965: ${(survived(1965) * 100).toFixed(1)}%`);
    console.log(`Reach 1975: ${(survived(1975) * 100).toFixed(1)}%`);
    console.log(`Reach 2000: ${(survived(2000) * 100).toFixed(1)}%`);
    console.log(`Complete 2030: ${((completed / RUNS) * 100).toFixed(1)}%`);
    console.log(`End states: ${reasons.map(([reason, count]) => `${reason} ${count}`).join(' · ')}`);
    return {
        completionRate: completed / RUNS,
        foundingMilestoneRate: survived(1965),
    };
};

console.log(`Seeded balance simulation: ${RUNS} runs per strategy`);
const smart = summarize('Survival-aware policy choices', Array.from({ length: RUNS }, (_, index) => simulate(index + 1, 'smart')));
const random = summarize('Random policy choices', Array.from({ length: RUNS }, (_, index) => simulate(index + 1, 'random')));

const balanceRegressed =
    smart.foundingMilestoneRate < 1 ||
    smart.completionRate < 0.7 ||
    smart.completionRate > 0.99 ||
    random.completionRate < 0.01 ||
    random.completionRate > 0.35;

if (balanceRegressed) {
    console.error('\nBalance regression: expected every run to reach 1965, smart completion between 70–99%, and random completion between 1–35%.');
    process.exitCode = 1;
}
