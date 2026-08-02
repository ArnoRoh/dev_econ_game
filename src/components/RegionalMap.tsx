import type { DiplomaticPartner, GameState } from '../engine/types';
import './RegionalMap.css';

interface RegionalMapProps {
    state: GameState;
    partners: DiplomaticPartner[];
}

const relationLabel = (value: number) => value >= 70 ? 'Allied' : value >= 50 ? 'Cordial' : value >= 30 ? 'Wary' : 'Hostile';

export const RegionalMap = ({ state, partners }: RegionalMapProps) => {
    const activePartner = partners.find(partner => partner.id === state.activePartnerId);
    const regionalStanding = Math.round(
        partners.reduce((sum, partner) => sum + (state.neighborRelations[partner.id] ?? partner.initialRelations), 0) / partners.length,
    );

    return (
        <section className="regional-panel">
            <div className="regional-map mat-paper mat-grain mat-vignette anim-settle">
                <div className="map-contours" aria-hidden="true" />
                {activePartner && <div className={`pact-line ${activePartner.position}`} aria-hidden="true" />}
                <div className="home-state">
                    <span>{state.countryName}</span>
                    <strong>{regionalStanding}</strong>
                    <small>regional standing</small>
                </div>
                {partners.map(partner => {
                    const relations = state.neighborRelations[partner.id] ?? partner.initialRelations;
                    const active = partner.id === state.activePartnerId;
                    return (
                        <div className={`neighbor-state ${partner.position} ${active ? 'active' : ''}`} key={partner.id}>
                            <span>{partner.shortName}</span>
                            <strong>{Math.round(relations)}</strong>
                            <small>{relationLabel(relations)}</small>
                        </div>
                    );
                })}
                {/* A small printed compass rose, matching the one on the province map,
                    rather than a bare "N" — this and ProvinceMap are meant to read as
                    pages from the same atlas. */}
                <svg className="map-compass" viewBox="0 0 20 20" aria-hidden="true">
                    <circle className="map-compass-plate" cx="10" cy="10" r="9.4" />
                    <circle className="map-compass-ring" cx="10" cy="10" r="6.6" />
                    <path className="map-compass-needle-dark" d="M10,3.4 L11.9,10 L10,16.6 Z" />
                    <path className="map-compass-needle-light" d="M10,3.4 L8.1,10 L10,16.6 Z" />
                    <path className="map-compass-needle-cross" d="M3.4,10 L10,8.6 L16.6,10 L10,11.4 Z" />
                    <text className="map-compass-label" x="10" y="2.6" textAnchor="middle">N</text>
                </svg>
            </div>
            <div className="regional-brief mat-paper mat-grain anim-rise">
                <span className="eyebrow">Regional diplomacy</span>
                <h3>{activePartner ? activePartner.pactName : 'Non-Aligned Posture'}</h3>
                <p>
                    {activePartner
                        ? `${activePartner.name}: ${activePartner.doctrine}`
                        : 'No formal regional pact. The republic retains freedom of action but receives no treaty dividends.'}
                </p>
                <hr className="rule-double" />
                <div className="relation-list">
                    {partners.map(partner => {
                        const value = state.neighborRelations[partner.id] ?? partner.initialRelations;
                        return (
                            <div key={partner.id}>
                                <span>{partner.name}</span>
                                <div className="relation-track"><i style={{ width: `${value}%` }} /></div>
                                <strong>{Math.round(value)}</strong>
                            </div>
                        );
                    })}
                </div>
                <small className="summit-note">Regional summit every decade from 1965</small>
            </div>
        </section>
    );
};
