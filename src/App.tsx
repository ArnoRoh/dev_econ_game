import { useState } from 'react';
import { createInitialState, advanceTurn, applyOption, checkGameOver, selectWeightedEvent } from './engine/gameLogic';
import type { GameState, EventOption, GameEvent, Artifact } from './engine/types';
import { ARTIFACTS } from './data/artifacts';
import { EVENTS } from './data/events';
import { Dashboard } from './components/Dashboard';
import { EventModal } from './components/EventModal';
import { IntroModal } from './components/IntroModal';

import './components/Tooltip.css';

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [introShown, setIntroShown] = useState(false);

  // v1.3 Point Buy System
  const [selectedArtifacts, setSelectedArtifacts] = useState<Artifact[]>([]);
  const POINTS_BUDGET = 5;

  const toggleArtifact = (artifact: Artifact) => {
    if (selectedArtifacts.find(a => a.id === artifact.id)) {
      setSelectedArtifacts(selectedArtifacts.filter(a => a.id !== artifact.id));
    } else {
      setSelectedArtifacts([...selectedArtifacts, artifact]);
    }
  };

  const getPointsUsed = () => selectedArtifacts.reduce((sum, a) => sum + (a.pointCost || 0), 0);
  const pointsRemaining = POINTS_BUDGET - getPointsUsed();
  const isValidSelection = pointsRemaining >= 0;

  const startGame = () => {
    if (!isValidSelection || selectedArtifacts.length === 0) return;
    const initial = createInitialState(selectedArtifacts);
    setGameState(initial);
    setCurrentEvent(null);
    setIntroShown(false);
  };

  const handleNextTurn = () => {
    if (!gameState) return;

    // Check for game over first (though usually checked after actions)
    let state = checkGameOver(gameState);
    if (state.gameOver) {
      setGameState(state);
      return;
    }

    // Advance
    state = advanceTurn(state);

    // Check again after advancing (e.g. Famine)
    state = checkGameOver(state);
    setGameState(state);

    if (state.gameOver) return;

    // v1.4: Annual Policy Decision (100% Chance)
    // Weighted by current artifacts
    const event = selectWeightedEvent(EVENTS, state);
    setCurrentEvent(event);
  };

  const handleOptionSelect = (option: EventOption) => {
    if (!gameState) return;
    let nextState = applyOption(gameState, option);
    setCurrentEvent(null);

    // Check game over immediately after choice
    nextState = checkGameOver(nextState);
    setGameState(nextState);
  };

  if (!gameState) {
    return (
      <div className="menu-screen">
        <h1 className="title">Post-Colonial Republic</h1>
        <p className="subtitle">Constitutional Convention (v1.5)</p>

        <div className="selection-container" style={{ textAlign: 'left', maxWidth: '800px', margin: '0 auto' }}>
          <div className="points-display" style={{
            color: pointsRemaining < 0 ? '#e57373' : '#81c784',
            fontSize: '1.2rem',
            marginBottom: '20px',
            textAlign: 'center',
            border: '1px solid #444',
            padding: '10px'
          }}>
            Constitution Points: {pointsRemaining} / {POINTS_BUDGET}
          </div>

          <div className="artifacts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px', maxHeight: '500px', overflowY: 'auto' }}>
            {ARTIFACTS.map(a => {
              const isSelected = !!selectedArtifacts.find(sa => sa.id === a.id);
              return (
                <div key={a.id}
                  onClick={() => toggleArtifact(a)}
                  style={{
                    border: isSelected ? '1px solid #d4af37' : '1px solid #333',
                    backgroundColor: isSelected ? 'rgba(212, 175, 55, 0.1)' : '#222',
                    padding: '15px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}>
                  <div style={{ fontWeight: 'bold', color: isSelected ? '#d4af37' : '#ccc' }}>{a.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#888', margin: '5px 0' }}>{a.description}</div>
                  <div style={{
                    position: 'absolute', top: '5px', right: '5px',
                    fontSize: '0.7em', fontWeight: 'bold',
                    color: (a.pointCost || 0) > 0 ? '#e57373' : '#81c784'
                  }}>
                    Cost: {a.pointCost}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          className="primary-button"
          onClick={startGame}
          disabled={!isValidSelection || selectedArtifacts.length === 0}
          style={{ marginTop: '30px' }}
        >
          Ratify Constitution
        </button>
      </div>
    );
  }

  if (gameState.gameOver) {
    const score = Math.round(
      (gameState.country.gdp / 10) +
      (gameState.country.stability * 10) +
      (gameState.country.educationLevel * 20) -
      (gameState.country.externalDebt / 5)
    );

    return (
      <div className="menu-screen game-over">
        <h1 className="title error">Regime Collapse</h1>
        <h2 className="reason">{gameState.gameOverReason}</h2>
        <p className="summary">You governed for {gameState.turn} years (1960 - {gameState.year}).</p>

        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', margin: '30px 0', textAlign: 'left' }}>
          <div><strong>Final GDP:</strong> ${Math.round(gameState.country.gdp).toLocaleString()}M</div>
          <div><strong>Final Pop:</strong> {gameState.country.population.toFixed(1)}M</div>
          <div><strong>Stability:</strong> {Math.round(gameState.country.stability)}%</div>
          <div><strong>Debt:</strong> ${Math.round(gameState.country.externalDebt).toLocaleString()}M</div>
        </div>

        <div className="final-score" style={{ fontSize: '2rem', color: '#d4af37', borderTop: '1px solid #444', paddingTop: '20px' }}>
          Legacy Score: {score}
        </div>

        <button className="primary-button" onClick={() => setGameState(null)} style={{ marginTop: '30px' }}>Return to History</button>
      </div>
    );
  }

  // v1.7: Intro Narrative
  if (gameState && !introShown) {
    return <IntroModal onStart={() => setIntroShown(true)} />;
  }

  return (
    <div className="game-screen">
      <div className="artifacts-bar">
        {gameState.artifacts.map(a => (
          <span key={a.id} className="artifact-tag" data-tooltip={a.description}>{a.name}</span>
        ))}
      </div>

      <Dashboard stats={gameState.country} year={gameState.year} />

      <div className="controls">
        <button className="primary-button next-turn" onClick={handleNextTurn} disabled={!!currentEvent}>
          Advance Fiscal Year
        </button>
      </div>

      {currentEvent && (
        <EventModal event={currentEvent} onOptionSelect={handleOptionSelect} />
      )}
    </div>
  );
}

export default App;
