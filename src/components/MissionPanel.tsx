import type { CountryStats, NationalMission } from '../engine/types';
import { evaluateMission } from '../engine/missionLogic';
import './MissionPanel.css';

interface MissionPanelProps {
    mission: NationalMission;
    stats: CountryStats;
}

const formatValue = (value: number, format: 'number' | 'percent' | 'currency') => {
    if (format === 'currency') return `$${Math.round(value).toLocaleString()}`;
    if (format === 'percent') return `${Math.round(value)}%`;
    return Math.round(value).toLocaleString();
};

export const MissionPanel = ({ mission, stats }: MissionPanelProps) => {
    const evaluation = evaluateMission(mission, stats);

    return (
        <section className="mission-panel">
            <div className="mission-panel-heading">
                <div>
                    <span className="eyebrow">National mission</span>
                    <h3>{mission.name}</h3>
                </div>
                <div className="mission-total">{Math.round(evaluation.progress * 100)}%</div>
            </div>
            <div className="mission-progress-track" aria-label={`Mission ${Math.round(evaluation.progress * 100)}% complete`}>
                <div className="mission-progress-fill" style={{ width: `${evaluation.progress * 100}%` }} />
            </div>
            <div className="mission-goals">
                {evaluation.goals.map(goal => (
                    <div className={`mission-goal ${goal.completed ? 'complete' : ''}`} key={goal.metric}>
                        <span className="mission-goal-check">{goal.completed ? '✓' : '○'}</span>
                        <span>{goal.label}</span>
                        <strong>
                            {formatValue(goal.value, goal.format)} / {formatValue(goal.target, goal.format)}
                        </strong>
                    </div>
                ))}
            </div>
        </section>
    );
};
