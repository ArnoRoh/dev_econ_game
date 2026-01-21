import React, { useEffect, useState } from 'react';
import './Leaderboard.css';

interface LeaderboardEntry {
    name: string;
    score: number;
    year: number;
    reason: string;
    date: number; // Timestamp
}

interface LeaderboardProps {
    currentScore?: LeaderboardEntry; // If provided, highlight this entry
}

const STORAGE_KEY = 'dev_econ_leaderboard';

export const Leaderboard: React.FC<LeaderboardProps> = ({ currentScore }) => {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

    useEffect(() => {
        // Load entries from local storage
        const stored = localStorage.getItem(STORAGE_KEY);
        let loadedEntries: LeaderboardEntry[] = stored ? JSON.parse(stored) : [];

        // If a new score is provided, retrieve it from the storage logic handled in App.tsx 
        // OR pass it in and merge here?
        // Better: App.tsx handles saving to storage, this component just reads and displays.
        // Re-read storage on mount.

        // However, if we just saved it in App.tsx before rendering this, it should be there.
        setEntries(loadedEntries.sort((a, b) => b.score - a.score));
    }, []);

    const clearHistory = () => {
        if (window.confirm('Are you sure you want to clear the Hall of Fame?')) {
            localStorage.removeItem(STORAGE_KEY);
            setEntries([]);
        }
    };

    return (
        <div className="leaderboard-container">
            <h2 className="leaderboard-title">Hall of Fame</h2>

            {entries.length === 0 ? (
                <div className="no-scores">No records found. Be the first to lead the nation!</div>
            ) : (
                <div className="leaderboard-table-wrapper">
                    <table className="leaderboard-table">
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'center' }}>Rank</th>
                                <th>Nation</th>
                                <th>Legacy Score</th>
                                <th>Year Reached</th>
                                <th>Fate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry, index) => {
                                // Highlight if it matches the current game's timestamp
                                const isCurrent = currentScore && entry.date === currentScore.date;

                                return (
                                    <tr key={index} style={isCurrent ? { backgroundColor: 'rgba(212, 175, 55, 0.2)' } : {}}>
                                        <td className="rank-column" style={{ color: index < 3 ? '#d4af37' : '#888' }}>
                                            {index + 1}
                                        </td>
                                        <td style={{ fontWeight: isCurrent ? 'bold' : 'normal' }}>
                                            {entry.name}
                                        </td>
                                        <td className="score-column">{entry.score}</td>
                                        <td>{entry.year}</td>
                                        <td style={{ fontSize: '0.9em', color: '#aaa' }}>{entry.reason}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="leaderboard-controls">
                <button className="clear-history-btn" onClick={clearHistory}>
                    Reset History
                </button>
            </div>
        </div>
    );
};
