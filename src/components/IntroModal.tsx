import React, { useState } from 'react';
import './EventModal.css'; // Reusing modal styles for consistency

interface IntroModalProps {
    onStart: (name: string) => void;
}

export const IntroModal: React.FC<IntroModalProps> = ({ onStart }) => {
    const [countryName, setCountryName] = useState('');

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '700px', textAlign: 'left' }}>
                <h2 className="event-title" style={{ borderBottom: '1px solid #d4af37', paddingBottom: '15px' }}>
                    Dawn of Independence
                </h2>

                <div className="event-description" style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
                    <p>
                        The year is 1960. After decades of struggle, the colonial flag has finally been lowered from the Government Palace. The streets are filled with jubilation, fireworks, and hope.
                    </p>
                    <p>
                        But as the foreign administrators pack their bags, the reality of the situation settles in. They have left behind a nation drawn on a map with a ruler—borders that cut across ethnic lines, an economy designed solely for extraction, and a treasury that is eerily empty.
                    </p>
                    <p>
                        You have been chosen to lead the Transitional Government. The excitement of the revolution is over; the hard work of building a nation state has just begun.
                    </p>
                    <p>
                        What will you name this new republic?
                    </p>

                    <div style={{ margin: '20px 0', textAlign: 'center' }}>
                        <input
                            type="text"
                            placeholder="e.g. Republic of Wakanda"
                            value={countryName}
                            onChange={(e) => setCountryName(e.target.value)}
                            style={{
                                width: '100%',
                                maxWidth: '400px',
                                padding: '12px',
                                fontSize: '1.2rem',
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid #d4af37',
                                color: '#eee',
                                borderRadius: '4px',
                                textAlign: 'center'
                            }}
                        />
                    </div>

                    <p>
                        You must balance the demands of the people for immediate prosperity with the cold, hard laws of economics. The decisions you make in these first few years will determine whether this nation rises to become a tiger of the global south, or succumbs to the cycle of poverty and violence.
                    </p>
                    <p>
                        History is watching.
                    </p>
                </div>

                <div className="modal-options">
                    <button
                        className="option-button"
                        onClick={() => {
                            if (countryName.trim().length > 0) {
                                onStart(countryName);
                            } else {
                                alert("Please name your country to begin.");
                            }
                        }}
                        style={{
                            background: countryName.trim().length > 0 ? 'rgba(212, 175, 55, 0.2)' : 'rgba(100, 100, 100, 0.2)',
                            color: countryName.trim().length > 0 ? '#d4af37' : '#888',
                            cursor: countryName.trim().length > 0 ? 'pointer' : 'not-allowed'
                        }}
                        disabled={countryName.trim().length === 0}
                    >
                        <div className="option-text" style={{ textAlign: 'center', fontWeight: 'bold' }}>Begin Governance</div>
                    </button>
                </div>
            </div>
        </div>
    );
};
