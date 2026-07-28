import type { CountryStats, GameState, MissionGoal, NationalMission } from './types';

export interface MissionGoalProgress extends MissionGoal {
    value: number;
    progress: number;
    completed: boolean;
}

export interface MissionEvaluation {
    goals: MissionGoalProgress[];
    progress: number;
    bonus: number;
    completed: boolean;
}

const GOAL_BONUS = 500;

const getMetricValue = (stats: CountryStats, goal: MissionGoal): number => {
    if (goal.metric === 'gdpPerCapita') {
        return stats.gdp / Math.max(stats.population, 0.1);
    }

    return stats[goal.metric] ?? 0;
};

export const evaluateMission = (mission: NationalMission, stats: CountryStats): MissionEvaluation => {
    const goals = mission.goals.map((goal): MissionGoalProgress => {
        const value = getMetricValue(stats, goal);
        const completed = goal.direction === 'atLeast' ? value >= goal.target : value <= goal.target;
        const progress = goal.direction === 'atLeast'
            ? Math.min(1, Math.max(0, value / goal.target))
            : Math.min(1, goal.target / Math.max(goal.target, value));

        return { ...goal, value, progress, completed };
    });

    const progress = goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length;

    return {
        goals,
        progress,
        bonus: Math.round(goals.reduce((sum, goal) => sum + goal.progress * GOAL_BONUS, 0)),
        completed: goals.every(goal => goal.completed),
    };
};

export const calculateLegacyScore = (state: GameState, mission: NationalMission) => {
    const base = Math.round(
        (state.country.gdp / 10) +
        (state.country.stability * 10) +
        (state.country.educationLevel * 20) -
        (state.country.externalDebt / 5) +
        (state.treasury / 2)
    );
    const missionEvaluation = evaluateMission(mission, state.country);

    return {
        base,
        missionBonus: missionEvaluation.bonus,
        total: base + missionEvaluation.bonus,
        missionEvaluation,
    };
};
