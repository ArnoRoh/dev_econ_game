import type { CountryStats, DevelopmentProject } from '../engine/types';
import './NationOverview.css';

interface NationOverviewProps {
    stats: CountryStats;
    projects: DevelopmentProject[];
    levels: Record<string, number>;
}

export const NationOverview = ({ stats, projects, levels }: NationOverviewProps) => {
    const totalLevels = Object.values(levels).reduce((sum, level) => sum + level, 0);
    const buildingCount = Math.min(12, 3 + Math.floor(stats.gdp / 650));
    const developmentTier = totalLevels < 4 ? 'Founding State' : totalLevels < 9 ? 'Developing Republic' : 'Regional Power';

    return (
        <section className="nation-overview">
            <div className="nation-scene" aria-label={`${developmentTier} skyline with ${totalLevels} project levels`}>
                <div className="nation-sun" />
                <div className="nation-mountains" />
                <div className="nation-city">
                    {Array.from({ length: buildingCount }, (_, index) => (
                        <div
                            className="nation-building"
                            key={index}
                            style={{ height: `${28 + ((index * 19 + totalLevels * 7) % 72)}px` }}
                        >
                            <span /><span /><span />
                        </div>
                    ))}
                </div>
                {(levels.transport ?? 0) > 0 && <div className="nation-rail"><span /></div>}
                {(levels.industry ?? 0) > 0 && <div className="nation-factory">▥</div>}
                {(levels.irrigation ?? 0) > 0 && <div className="nation-fields" />}
                <div className="nation-scene-label">
                    <span>National development</span>
                    <strong>{developmentTier}</strong>
                </div>
            </div>
            <div className="nation-projects">
                {projects.map(project => {
                    const level = levels[project.id] ?? 0;
                    return (
                        <div className={`nation-project ${level > 0 ? 'built' : ''}`} key={project.id} title={project.description}>
                            <span className="nation-project-icon">{project.icon}</span>
                            <div>
                                <span>{project.name}</span>
                                <div className="level-pips">
                                    {Array.from({ length: project.maxLevel }, (_, index) => (
                                        <i className={index < level ? 'active' : ''} key={index} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};
