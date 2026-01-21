import React from 'react';
import type { GameEvent, EventOption } from '../engine/types';
import './EventModal.css';

interface EventModalProps {
    event: GameEvent;
    onOptionSelect: (option: EventOption) => void;
}

export const EventModal: React.FC<EventModalProps> = ({ event, onOptionSelect }) => {
    const [isMinimized, setIsMinimized] = React.useState(false);

    if (isMinimized) {
        return (
            <div className="modal-minimized-controls">
                <button
                    className="restore-button"
                    onClick={() => setIsMinimized(false)}
                >
                    Return to Decision
                </button>
            </div>
        );
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2 className="event-title">{event.title}</h2>
                    <button
                        className="view-stats-button"
                        onClick={() => setIsMinimized(true)}
                        title="Hide event temporarily to view stats"
                    >
                        👁️ View Stats
                    </button>
                </div>

                {event.image && (
                    <div className="event-image-container" style={{ margin: '15px 0', textAlign: 'center' }}>
                        <img src={event.image} alt={event.title} style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid #444' }} />
                    </div>
                )}

                <p className="event-description">{event.description}</p>

                {(event.theory || event.source) && (
                    <div className="theory-box" style={{ maxHeight: '200px', overflowY: 'auto', textAlign: 'left', padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', border: '1px solid #444', margin: '15px 0' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#81c784', borderBottom: '1px solid #444', paddingBottom: '5px' }}>Economic Principle</h4>
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5', fontSize: '0.9rem', color: '#ddd' }}>
                            {event.theory}
                        </div>
                        {event.source && <div style={{ marginTop: '10px', fontStyle: 'italic', fontSize: '0.8rem', color: '#888' }}>Source: {event.source}</div>}
                        {event.wikiLink && (
                            <div style={{ marginTop: '10px', textAlign: 'right' }}>
                                <a href={event.wikiLink} target="_blank" rel="noopener noreferrer" style={{ color: '#64b5f6', textDecoration: 'none', fontSize: '0.9rem' }}>
                                    Read more on Wikipedia ↗
                                </a>
                            </div>
                        )}
                    </div>
                )}

                <div className="modal-options">
                    {event.options.map((option, index) => (
                        <button key={index} className="option-button" onClick={() => onOptionSelect(option)}>
                            <div className="option-text">{option.text}</div>
                            <div className="option-effects">
                                {Object.entries(option.effects).map(([key, value]) => (
                                    <span key={key} className={value > 0 ? 'effect-pos' : 'effect-neg'}>
                                        {key.toUpperCase()}: {value > 0 ? '+' : ''}{value}
                                    </span>
                                ))}
                            </div>
                            {option.explanation && (
                                <div className="option-explanation" style={{ fontSize: '0.85em', color: '#aaa', marginTop: '5px', fontStyle: 'italic' }}>
                                    ℹ️ {option.explanation}
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
