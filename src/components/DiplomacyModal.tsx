import type { DiplomaticPartner } from '../engine/types';
import { formatEffect } from '../effectFormatting';
import './DiplomacyModal.css';

interface DiplomacyModalProps {
    partners: DiplomaticPartner[];
    relations: Record<string, number>;
    activePartnerId: string | null;
    year: number;
    onSign: (partner: DiplomaticPartner) => void;
    onDecline: () => void;
}

const effectText = (effects: DiplomaticPartner['pactEffects']) => Object.entries(effects)
    .map(([key, value]) => formatEffect(key, value))
    .join(' · ');

export const DiplomacyModal = ({ partners, relations, activePartnerId, year, onSign, onDecline }: DiplomacyModalProps) => (
    <div className="modal-overlay diplomacy-overlay">
        <div className="diplomacy-modal">
            <span className="diplomacy-kicker">Regional summit · {year}</span>
            <h2>Choose the Republic’s Alignment</h2>
            <p>
                One treaty will define the next decade. Signing improves relations with that partner by 20,
                cools every rival relationship by 5, and replaces the current treaty’s annual dividend.
            </p>
            <div className="diplomacy-grid">
                {partners.map(partner => {
                    const current = partner.id === activePartnerId;
                    return (
                        <button className={`diplomacy-card ${current ? 'current' : ''}`} key={partner.id} onClick={() => onSign(partner)}>
                            <div className="diplomacy-card-heading">
                                <span>{partner.position}</span>
                                <strong>Relations {Math.round(relations[partner.id] ?? partner.initialRelations)}</strong>
                            </div>
                            <h3>{partner.name}</h3>
                            <h4>{partner.pactName}</h4>
                            <p>{partner.description}</p>
                            <small>{partner.doctrine}</small>
                            <div className="diplomacy-effects">
                                <span><strong>On signing</strong>{effectText(partner.pactEffects)}</span>
                                <span><strong>Every year</strong>{effectText(partner.annualEffects)}</span>
                            </div>
                            {current && <em>Renew current pact</em>}
                        </button>
                    );
                })}
            </div>
            <button type="button" className="diplomacy-decline" onClick={onDecline}>
                Remain non-aligned
                <small>
                    Take aid from both blocs and orders from neither. No treaty dividend, a little
                    goodwill lost everywhere, and a free hand for the next decade.
                </small>
            </button>
        </div>
    </div>
);
