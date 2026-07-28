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
            <div className="regional-map">
                <div className="map-contours" />
                {activePartner && <div className={`pact-line ${activePartner.position}`} />}
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
                <span className="map-compass">N</span>
            </div>
            <div className="regional-brief">
                <span className="eyebrow">Regional diplomacy</span>
                <h3>{activePartner ? activePartner.pactName : 'Non-Aligned Posture'}</h3>
                <p>
                    {activePartner
                        ? `${activePartner.name}: ${activePartner.doctrine}`
                        : 'No formal regional pact. The republic retains freedom of action but receives no treaty dividends.'}
                </p>
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
