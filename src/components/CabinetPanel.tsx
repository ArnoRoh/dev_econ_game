import type { CountryStats, GameState } from '../engine/types';
import { formatEffect } from '../effectFormatting';
import './CabinetPanel.css';

interface CabinetAlert {
    severity: 'watch' | 'danger';
    title: string;
    detail: string;
}

const getAlerts = (state: GameState): CabinetAlert[] => {
    const stats = state.country;
    const alerts: CabinetAlert[] = [];
    const coupThreshold = stats.militaryPower > 80 ? 55 : 40;
    const debtRatio = stats.externalDebt / Math.max(1, stats.gdp);

    if (stats.stability < coupThreshold + 12) {
        alerts.push({
            severity: stats.stability < coupThreshold || stats.eliteSatisfaction < 35 ? 'danger' : 'watch',
            title: 'Regime security',
            detail: `Stability is ${Math.round(stats.stability)}%; a coup becomes possible below ${coupThreshold}% when elite support is weak.`,
        });
    }
    if (stats.famineRisk > 45) {
        alerts.push({
            severity: stats.famineRisk > 75 ? 'danger' : 'watch',
            title: 'Food emergency',
            detail: `Famine risk has reached ${Math.round(stats.famineRisk)}%. The regime falls above 90%.`,
        });
    }
    if (stats.militaryPower < 22) {
        alerts.push({
            severity: stats.militaryPower < 14 ? 'danger' : 'watch',
            title: 'Exposed borders',
            detail: `Military capacity is ${Math.round(stats.militaryPower)}%. Invasion occurs below 10%.`,
        });
    }
    if (debtRatio > 0.45) {
        alerts.push({
            severity: debtRatio > 0.8 ? 'danger' : 'watch',
            title: 'Debt overhang',
            detail: `External debt is ${Math.round(debtRatio * 100)}% of GDP and is dragging on annual growth.`,
        });
    }
    if (state.year > 1960 && (state.lastFiscalBalance < 0 || state.treasury < 60)) {
        alerts.push({
            severity: state.lastFiscalBalance < -20 || state.treasury < 20 ? 'danger' : 'watch',
            title: 'Fiscal squeeze',
            detail: `Treasury holds $${Math.round(state.treasury)}M with a ${state.lastFiscalBalance >= 0 ? 'surplus' : 'deficit'} of $${Math.abs(Math.round(state.lastFiscalBalance))}M per year.`,
        });
    }
    if (stats.gdpGrowthRate < 0) {
        alerts.push({
            severity: stats.gdpGrowthRate < -2 ? 'danger' : 'watch',
            title: 'Recession',
            detail: `The economy is contracting at ${stats.gdpGrowthRate.toFixed(1)}%, increasing food and political pressure.`,
        });
    }

    return alerts.slice(0, 3);
};

const formatEffects = (effects: Partial<CountryStats>) => Object.entries(effects)
    .map(([key, value]) => formatEffect(key, value))
    .join(' · ');

export const CabinetPanel = ({ state }: { state: GameState }) => {
    const alerts = getAlerts(state);
    const recentHistory = state.chronicle.slice(-6).reverse();

    return (
        <section className="cabinet-panel">
            <div className="cabinet-heading">
                <div>
                    <span className="eyebrow">Cabinet intelligence</span>
                    <h3>{alerts.length > 0 ? 'Risks demanding attention' : 'No immediate national emergency'}</h3>
                </div>
                <span className={`cabinet-status ${alerts.some(alert => alert.severity === 'danger') ? 'danger' : alerts.length > 0 ? 'watch' : 'steady'}`}>
                    {alerts.some(alert => alert.severity === 'danger') ? 'Critical' : alerts.length > 0 ? 'Watch' : 'Steady'}
                </span>
            </div>

            {alerts.length > 0 && (
                <div className="cabinet-alerts">
                    {alerts.map(alert => (
                        <div className={`cabinet-alert ${alert.severity}`} key={alert.title}>
                            <strong>{alert.title}</strong>
                            <span>{alert.detail}</span>
                        </div>
                    ))}
                </div>
            )}

            <details className="chronicle">
                <summary>Open the national chronicle <span>{state.chronicle.length} decisions recorded</span></summary>
                {recentHistory.length === 0 ? (
                    <p className="chronicle-empty">The first cabinet decision will begin the historical record.</p>
                ) : (
                    <div className="chronicle-list">
                        {recentHistory.map(entry => (
                            <article key={entry.id}>
                                <span className={`chronicle-year ${entry.category}`}>{entry.year}</span>
                                <div>
                                    <small>{entry.category === 'project' ? 'Development plan' : entry.title}</small>
                                    <strong>{entry.decision}</strong>
                                    <p>{formatEffects(entry.effects)}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </details>
        </section>
    );
};
