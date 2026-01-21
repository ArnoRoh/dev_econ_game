import { useState } from 'react';
import { createInitialState, advanceTurn, applyOption, checkGameOver, selectWeightedEvent } from './engine/gameLogic';
import type { GameState, EventOption, GameEvent, Artifact } from './engine/types';
import { ARTIFACTS } from './data/artifacts';
import { EVENTS } from './data/events';
import { Dashboard } from './components/Dashboard';
import { EventModal } from './components/EventModal';
import { IntroModal } from './components/IntroModal';
import { Leaderboard } from './components/Leaderboard';

import './components/Tooltip.css';

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);

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

  // Intermediate state to show IntroModal before GameState is fully active?
  // Previous flow: 
  // 1. !gameState -> Menu
  // 2. startGame -> setGameState (initial) -> setIntroShown(false)
  // 3. Render -> if gameState && !introShown -> IntroModal
  // 4. IntroModal onStart -> setIntroShown(true) -> Dashboard

  // NEW FLOW:
  // 1. !gameState -> Menu
  // 2. User clicks "Ratify" -> Set a flag `isNaming`? Or just use `introShown` logic?
  // We need to delay `createInitialState` until we have the name.

  // Let's implement an `isNaming` state.
  const [isNaming, setIsNaming] = useState(false);

  const startNaming = () => {
    if (!isValidSelection || selectedArtifacts.length === 0) return;
    setIsNaming(true);
  }

  const finalizeGameStart = (name: string) => {
    const initial = createInitialState(selectedArtifacts, name);
    setGameState(initial);
    setCurrentEvent(null);
    setIsNaming(false);
  }

  const handleNextTurn = () => {
    if (!gameState) return;

    // Check for game over first (though usually checked after actions)
    let state = checkGameOver(gameState);
    if (state.gameOver) {
      handleGameOver(state);
      return;
    }

    // Advance
    state = advanceTurn(state);

    // Check again after advancing (e.g. Famine)
    state = checkGameOver(state);

    if (state.gameOver) {
      handleGameOver(state);
      return;
    }

    setGameState(state);

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
    if (nextState.gameOver) {
      handleGameOver(nextState);
    } else {
      setGameState(nextState);
    }
  };

  const handleGameOver = (finalState: GameState) => {
    setGameState(finalState);

    // Save to Leaderboard
    const score = Math.round(
      (finalState.country.gdp / 10) +
      (finalState.country.stability * 10) +
      (finalState.country.educationLevel * 20) -
      (finalState.country.externalDebt / 5)
    );

    const entry = {
      name: finalState.countryName,
      score: score,
      year: finalState.year,
      reason: finalState.gameOverReason || 'Unknown',
      date: Date.now()
    };

    const STORAGE_KEY = 'dev_econ_leaderboard';
    const stored = localStorage.getItem(STORAGE_KEY);
    let entries = stored ? JSON.parse(stored) : [];
    entries.push(entry);

    // Keep top 20
    entries.sort((a: any, b: any) => b.score - a.score);
    entries = entries.slice(0, 20);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  };

  if (!gameState && !isNaming) {
    return (
      <div className="menu-screen">
        <h1 className="title">Post-Colonial Republic</h1>
        <p className="subtitle">Constitutional Convention (v2.1)</p>

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
          onClick={startNaming}
          disabled={!isValidSelection || selectedArtifacts.length === 0}
          style={{ marginTop: '30px' }}
        >
          Ratify Constitution
        </button>
      </div>
    );
  }

  // Naming Phase (Reusing IntroModal)
  if (!gameState && isNaming) {
    return <IntroModal onStart={finalizeGameStart} />;
  }

  if (gameState && gameState.gameOver) {
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
        <p className="summary">You governed {gameState.countryName} for {gameState.turn} years (1960 - {gameState.year}).</p>

        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', margin: '30px 0', textAlign: 'left' }}>
          <div><strong>Final GDP:</strong> ${Math.round(gameState.country.gdp).toLocaleString()}M</div>
          <div><strong>Final Pop:</strong> {gameState.country.population.toFixed(1)}M</div>
          <div><strong>Stability:</strong> {Math.round(gameState.country.stability)}%</div>
          <div><strong>Debt:</strong> ${Math.round(gameState.country.externalDebt).toLocaleString()}M</div>
        </div>

        <div className="final-score" style={{ fontSize: '2rem', color: '#d4af37', borderTop: '1px solid #444', paddingTop: '20px' }}>
          Legacy Score: {score}
        </div>

        <Leaderboard />

        <button className="primary-button" onClick={() => setGameState(null)} style={{ marginTop: '30px' }}>Return to History</button>
      </div>
    );
  }

  // Removed old intro check logic since we do it before game start now

  return (
    <div className="game-screen">
      <div className="header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', background: '#111', borderBottom: '1px solid #333' }}>
        <div className="country-name" style={{ color: '#d4af37', fontWeight: 'bold', fontSize: '1.2rem' }}>{gameState?.countryName}</div>
        <div className="artifacts-bar">
          {gameState?.artifacts.map(a => (
            <span key={a.id} className="artifact-tag" data-tooltip={a.description}>{a.name}</span>
          ))}
        </div>
      </div>

      <Dashboard stats={gameState!.country} year={gameState!.year} />

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
