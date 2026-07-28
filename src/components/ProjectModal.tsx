import type { DevelopmentProject } from '../engine/types';
import { effectTone, formatEffect } from '../effectFormatting';
import './ProjectModal.css';

interface ProjectModalProps {
    projects: DevelopmentProject[];
    levels: Record<string, number>;
    year: number;
    treasury: number;
    canIssueBonds: boolean;
    onBuild: (project: DevelopmentProject) => void;
    onIssueBonds: () => void;
    onDefer: () => void;
}

export const ProjectModal = ({ projects, levels, year, treasury, canIssueBonds, onBuild, onIssueBonds, onDefer }: ProjectModalProps) => {
    const availableProjects = projects.filter(project => (levels[project.id] ?? 0) < project.maxLevel);

    return (
        <div className="modal-overlay project-overlay">
            <div className="project-modal">
                <span className="project-kicker">Five-year development plan · {year}</span>
                <h2>Build the Republic</h2>
                <p className="project-intro">
                    Cabinet capacity is limited. Choose one national project to fund this planning cycle.
                    Every upgrade changes both the skyline and the state beneath it.
                </p>
                <div className="planning-budget">
                    Available treasury <strong>${Math.round(treasury).toLocaleString()}M</strong>
                </div>
                <div className="project-grid">
                    {availableProjects.map(project => {
                        const level = levels[project.id] ?? 0;
                        const affordable = treasury >= project.treasuryCost;
                        return (
                            <button className={`project-card ${affordable ? '' : 'unaffordable'}`} disabled={!affordable} key={project.id} onClick={() => onBuild(project)}>
                                <div className="project-card-topline">
                                    <span className="project-icon">{project.icon}</span>
                                    <span className="project-level">Level {level + 1} / {project.maxLevel} · ${project.treasuryCost}M</span>
                                </div>
                                <h3>{project.name}</h3>
                                <p>{project.description}</p>
                                <div className="project-effects">
                                    {Object.entries(project.effects).map(([key, value]) => (
                                        <span className={effectTone(key, value)} key={key}>
                                            {formatEffect(key, value)}
                                        </span>
                                    ))}
                                </div>
                                <div className="project-dividend">
                                    <strong>Annual dividend</strong>
                                    <span>
                                        {Object.entries(project.annualEffects).map(([key, value]) => (
                                            formatEffect(key, value)
                                        )).join(' · ')}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
                <div className="planning-actions">
                    <button onClick={onIssueBonds} disabled={!canIssueBonds}>
                        Issue Development Bonds
                        <small>+$150M treasury · +$180M debt</small>
                    </button>
                    <button onClick={onDefer}>
                        Defer This Plan
                        <small>Preserve the treasury; build nothing this cycle</small>
                    </button>
                </div>
            </div>
        </div>
    );
};
