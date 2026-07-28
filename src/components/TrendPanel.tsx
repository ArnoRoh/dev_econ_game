import type { EconomicSnapshot } from '../engine/types';
import './TrendPanel.css';

interface TrendPanelProps {
    history: EconomicSnapshot[];
}

type SnapshotMetric = Exclude<keyof EconomicSnapshot, 'year'>;

const chartPoints = (history: EconomicSnapshot[], metric: SnapshotMetric, max: number, min = 0) => history
    .map((snapshot, index) => {
        const x = history.length === 1 ? 300 : 12 + (index / (history.length - 1)) * 576;
        const ratio = Math.max(0, Math.min(1, (snapshot[metric] - min) / Math.max(1, max - min)));
        const y = 142 - ratio * 118;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

const Grid = () => (
    <g className="trend-grid">
        <line x1="12" y1="24" x2="588" y2="24" />
        <line x1="12" y1="83" x2="588" y2="83" />
        <line x1="12" y1="142" x2="588" y2="142" />
    </g>
);

export const TrendPanel = ({ history }: TrendPanelProps) => {
    const latest = history[history.length - 1];
    const financialMax = Math.max(1, ...history.flatMap(snapshot => [snapshot.gdp, snapshot.externalDebt]));
    const firstYear = history[0]?.year ?? 1960;
    const lastYear = latest?.year ?? firstYear;

    return (
        <section className="trend-panel">
            <div className="trend-heading">
                <div>
                    <span className="eyebrow">National statistics office</span>
                    <h3>Historical Trends · {firstYear}–{lastYear}</h3>
                </div>
                <span>{history.length} annual observations</span>
            </div>
            <div className="trend-charts">
                <article>
                    <div className="trend-chart-title">
                        <strong>Economic scale</strong>
                        <div><i className="gdp" /> GDP <i className="debt" /> Debt</div>
                    </div>
                    <svg viewBox="0 0 600 160" role="img" aria-label="GDP and external debt history">
                        <Grid />
                        <polyline className="trend-line debt" points={chartPoints(history, 'externalDebt', financialMax)} />
                        <polyline className="trend-line gdp" points={chartPoints(history, 'gdp', financialMax)} />
                    </svg>
                    <div className="trend-axis"><span>{firstYear}</span><span>${Math.round(latest?.gdp ?? 0).toLocaleString()}M GDP</span><span>{lastYear}</span></div>
                </article>
                <article>
                    <div className="trend-chart-title">
                        <strong>State capacity</strong>
                        <div><i className="stability" /> Stability <i className="education" /> Education <i className="famine" /> Famine</div>
                    </div>
                    <svg viewBox="0 0 600 160" role="img" aria-label="Stability, education, and famine risk history">
                        <Grid />
                        <polyline className="trend-line famine" points={chartPoints(history, 'famineRisk', 100)} />
                        <polyline className="trend-line education" points={chartPoints(history, 'educationLevel', 100)} />
                        <polyline className="trend-line stability" points={chartPoints(history, 'stability', 100)} />
                    </svg>
                    <div className="trend-axis"><span>{firstYear}</span><span>0–100 index</span><span>{lastYear}</span></div>
                </article>
            </div>
        </section>
    );
};
