import React from 'react';
import type { CountryStats } from '../engine/types';
import './Dashboard.css';
import './Tooltip.css';

interface DashboardProps {
    stats: CountryStats;
    year: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, year }) => {
    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2>Republic Stats • {year}</h2>
                <div className="dashboard-gdp" data-tooltip="Total value of goods produced. Growth compounds significantly over time.">
                    GDP: ${Math.round(stats.gdp).toLocaleString()}M
                    <span style={{ fontSize: '0.8em', color: stats.gdpGrowthRate >= 0 ? '#81c784' : '#e57373', marginLeft: '10px' }}>
                        ({stats.gdpGrowthRate > 0 ? '+' : ''}{stats.gdpGrowthRate.toFixed(1)}%)
                    </span>
                </div>
            </div>
            <div className="dashboard-grid">
                <StatCard
                    label="Population"
                    value={`${stats.population.toFixed(1)}M`}
                    tooltip="Total citizens. Labor force scales with this."
                    subValue={`+${(2.0 + (stats.stability > 60 ? 0.5 : 0) - (stats.educationLevel * 0.04)).toFixed(2)}% / yr`}
                />
                <StatCard label="Stability" value={stats.stability} isPercentage tooltip="Political order. Low stability risks coups and reduces growth." />
                <StatCard label="Elite Support" value={stats.eliteSatisfaction} isPercentage tooltip="Approval of the wealthy/powerful. < 10% risks immediate overthrow." />
                <StatCard label="Military" value={stats.militaryPower} isPercentage tooltip="Capabilities of armed forces. < 10% risks foreign invasion." />
                <StatCard label="Education" value={stats.educationLevel} isPercentage tooltip="Human capital. primary driver of long-term economic growth." />
                <StatCard label="Famine Risk" value={stats.famineRisk} isPercentage inverse tooltip="Probability of food insecurity. > 90% ends the game." />
                <StatCard label="Intl. Relations" value={stats.internationalRelations} isPercentage tooltip="Standing with foreign powers. Affects aid and trade deals." />
                <StatCard label="Gender Eq." value={stats.genderEquality} isPercentage tooltip="Women's economic/political participation. Boosts GDP, lowers Pop growth." />
                <StatCard label="Ext. Debt" value={`$${Math.round(stats.externalDebt)}M`} tooltip="Money owed to foreign creditors. Interest payments reduce growth." />
            </div>
        </div>
    );
};

const StatCard = ({ label, value, isPercentage, inverse, tooltip, subValue }: { label: string, value: number | string, isPercentage?: boolean, inverse?: boolean, tooltip?: string, subValue?: string }) => {
    let statusClass = 'neutral';

    if (typeof value === 'number' && isPercentage) {
        const val = value;
        if (inverse) {
            if (val > 50) statusClass = 'bad';
            else if (val > 20) statusClass = 'mid';
            else statusClass = 'good';
        } else {
            if (val < 30) statusClass = 'bad';
            else if (val < 70) statusClass = 'mid';
            else statusClass = 'good';
        }
    }

    return (
        <div className="stat-card" data-tooltip={tooltip}>
            <div className="stat-label">{label}</div>
            <div className={`stat-value ${statusClass}`}>
                {typeof value === 'number' ? Math.round(value) : value}{isPercentage ? '%' : ''}
            </div>
            {subValue && <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '4px' }}>{subValue}</div>}
        </div>
    );
};
