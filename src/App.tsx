import { useEffect, useState } from 'react';
import { createInitialState, advanceTurn, applyOption, buildProject, checkGameOver, deferDevelopmentPlan, issueDevelopmentBonds, selectWeightedEvent, signDiplomaticPact } from './engine/gameLogic';
import { calculateLegacyScore } from './engine/missionLogic';
import type { GameState, EventOption, GameEvent, Artifact, DevelopmentProject, DiplomaticPartner } from './engine/types';
import { ARTIFACTS } from './data/artifacts';
import { EVENTS } from './data/events';
import { NATIONAL_MISSIONS } from './data/missions';
import { DEVELOPMENT_PROJECTS } from './data/projects';
import { DIPLOMATIC_PARTNERS } from './data/diplomacy';
import { Dashboard } from './components/Dashboard';
import { EventModal } from './components/EventModal';
import { IntroModal } from './components/IntroModal';
import { Leaderboard } from './components/Leaderboard';
import type { LeaderboardEntry } from './components/Leaderboard';
import { MissionPanel } from './components/MissionPanel';
import { NationOverview } from './components/NationOverview';
import { OutcomeBanner } from './components/OutcomeBanner';
import type { DecisionOutcome } from './components/OutcomeBanner';
import { ProjectModal } from './components/ProjectModal';
import { CabinetPanel } from './components/CabinetPanel';
import { clearSavedRun, hasSavedRun, loadRun, saveRun } from './saveGame';
import { RegionalMap } from './components/RegionalMap';
import { DiplomacyModal } from './components/DiplomacyModal';
import { TrendPanel } from './components/TrendPanel';

import './components/Tooltip.css';

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [lastOutcome, setLastOutcome] = useState<DecisionOutcome | null>(null);
  const [hasActiveSave, setHasActiveSave] = useState(() => hasSavedRun());

  // v1.3 Point Buy System
  const [selectedArtifacts, setSelectedArtifacts] = useState<Artifact[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
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

  useEffect(() => {
    if (!gameState || gameState.gameOver) return;
    saveRun({ gameState, currentEvent, lastOutcome });
  }, [gameState, currentEvent, lastOutcome]);

  const startNaming = () => {
    if (!isValidSelection || selectedArtifacts.length === 0 || !selectedMissionId) return;
    setIsNaming(true);
  }

  const finalizeGameStart = (name: string) => {
    if (!selectedMissionId) return;
    const initial = createInitialState(selectedArtifacts, name, selectedMissionId, DIPLOMATIC_PARTNERS);
    setGameState(initial);
    setCurrentEvent(null);
    setLastOutcome(null);
    setHasActiveSave(true);
    setIsNaming(false);
  }

  const continueSavedGame = () => {
    const saved = loadRun();
    if (!saved) {
      clearSavedRun();
      setHasActiveSave(false);
      return;
    }

    setGameState(saved.gameState);
    setCurrentEvent(saved.currentEvent);
    setLastOutcome(saved.lastOutcome);
    setIsNaming(false);
  };

  const handleNextTurn = () => {
    if (!gameState) return;
    setLastOutcome(null);

    // Check for game over first (though usually checked after actions)
    let state = checkGameOver(gameState);
    if (state.gameOver) {
      handleGameOver(state);
      return;
    }

    // Advance
    state = advanceTurn(state, DEVELOPMENT_PROJECTS, DIPLOMATIC_PARTNERS);

    // Check again after advancing (e.g. Famine)
    state = checkGameOver(state);

    if (state.gameOver) {
      handleGameOver(state);
      return;
    }

    // v1.4: Annual Policy Decision (100% Chance)
    // Weighted by current artifacts
    const event = selectWeightedEvent(EVENTS, state);
    if (event) {
      state = {
        ...state,
        recentEventIds: [...state.recentEventIds, event.id].slice(-10),
      };
    }

    setGameState(state);
    setCurrentEvent(event);
  };

  const handleOptionSelect = (option: EventOption) => {
    if (!gameState || !currentEvent) return;
    setLastOutcome({
      eventTitle: currentEvent.title,
      optionText: option.text,
      explanation: option.explanation,
      effects: option.effects,
    });
    let nextState = applyOption(gameState, option);
    nextState = {
      ...nextState,
      chronicle: [
        ...nextState.chronicle,
        {
          id: `${nextState.year}-${currentEvent.id}-${nextState.chronicle.length}`,
          year: nextState.year,
          category: 'policy',
          title: currentEvent.title,
          decision: option.text,
          effects: option.effects,
        },
      ],
    };
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
    clearSavedRun();
    setHasActiveSave(false);
    setGameState(finalState);

    // Save to Leaderboard
    const mission = NATIONAL_MISSIONS.find(item => item.id === finalState.missionId) ?? NATIONAL_MISSIONS[0];
    const score = calculateLegacyScore(finalState, mission);

    const entry: LeaderboardEntry = {
      name: finalState.countryName,
      score: score.total,
      year: finalState.year,
      reason: finalState.gameOverReason || 'Unknown',
      date: Date.now(),
      mission: mission.name,
    };

    const STORAGE_KEY = 'dev_econ_leaderboard';
    const stored = localStorage.getItem(STORAGE_KEY);
    let entries: LeaderboardEntry[] = stored ? JSON.parse(stored) as LeaderboardEntry[] : [];
    entries.push(entry);

    // Keep top 20
    entries.sort((a, b) => b.score - a.score);
    entries = entries.slice(0, 20);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  };

  const handleBuildProject = (project: DevelopmentProject) => {
    if (!gameState) return;
    const currentLevel = gameState.projectLevels[project.id] ?? 0;
    const builtState = buildProject(gameState, project);
    const nextState = checkGameOver({
      ...builtState,
      chronicle: [
        ...builtState.chronicle,
        {
          id: `${builtState.year}-project-${project.id}-${currentLevel + 1}`,
          year: builtState.year,
          category: 'project',
          title: 'Five-Year Development Plan',
          decision: `${project.name} · Level ${currentLevel + 1}`,
          effects: project.effects,
        },
      ],
    });
    if (nextState.gameOver) {
      setCurrentEvent(null);
      handleGameOver(nextState);
    } else {
      setGameState(nextState);
    }
  };

  const handleSignPact = (partner: DiplomaticPartner) => {
    if (!gameState) return;
    const alignedState = signDiplomaticPact(gameState, partner);
    const nextState = checkGameOver({
      ...alignedState,
      chronicle: [
        ...alignedState.chronicle,
        {
          id: `${alignedState.year}-diplomacy-${partner.id}`,
          year: alignedState.year,
          category: 'diplomacy',
          title: 'Regional Summit',
          decision: partner.pactName,
          effects: partner.pactEffects,
        },
      ],
    });

    if (nextState.gameOver) {
      setCurrentEvent(null);
      handleGameOver(nextState);
    } else {
      setGameState(nextState);
    }
  };

  const handleIssueBonds = () => {
    if (!gameState) return;
    const financedState = issueDevelopmentBonds(gameState);
    if (financedState === gameState) return;

    setGameState({
      ...financedState,
      chronicle: [
        ...financedState.chronicle,
        {
          id: `${financedState.year}-development-bonds`,
          year: financedState.year,
          category: 'project',
          title: 'Five-Year Development Plan',
          decision: 'Issued Development Bonds · Treasury +$150M',
          effects: { externalDebt: 180 },
        },
      ],
    });
  };

  const handleDeferPlan = () => {
    if (!gameState) return;
    const deferredState = deferDevelopmentPlan(gameState);
    if (deferredState === gameState) return;

    setGameState({
      ...deferredState,
      chronicle: [
        ...deferredState.chronicle,
        {
          id: `${deferredState.year}-plan-deferred`,
          year: deferredState.year,
          category: 'project',
          title: 'Five-Year Development Plan',
          decision: 'Development cycle deferred',
          effects: {},
        },
      ],
    });
  };

  if (!gameState && !isNaming) {
    return (
      <div className="menu-screen founding-screen">
        <div className="founding-content">
        {hasActiveSave && (
          <button className="continue-button" onClick={continueSavedGame}>
            Continue Saved Republic
          </button>
        )}
        <h1 className="title">Post-Colonial Republic</h1>
        <p className="subtitle">Constitutional Convention</p>

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

          <div className="mission-selection">
            <span className="selection-label">Choose a national mission</span>
            <div className="mission-selection-grid">
              {NATIONAL_MISSIONS.map(mission => (
                <button
                  className={`mission-selection-card ${selectedMissionId === mission.id ? 'selected' : ''}`}
                  key={mission.id}
                  onClick={() => setSelectedMissionId(mission.id)}
                >
                  <strong>{mission.name}</strong>
                  <span>{mission.description}</span>
                  <small>{mission.goals.map(goal => goal.label).join(' · ')}</small>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          className="primary-button"
          onClick={startNaming}
          disabled={!isValidSelection || selectedArtifacts.length === 0 || !selectedMissionId}
          style={{ marginTop: '30px' }}
        >
          Ratify Constitution
        </button>
        </div>
      </div>
    );
  }

  // Naming Phase (Reusing IntroModal)
  if (!gameState && isNaming) {
    return <IntroModal onStart={finalizeGameStart} />;
  }

  if (gameState && gameState.gameOver) {
    const mission = NATIONAL_MISSIONS.find(item => item.id === gameState.missionId) ?? NATIONAL_MISSIONS[0];
    const score = calculateLegacyScore(gameState, mission);
    const completedTerm = gameState.gameOverReason?.startsWith('Term Limit Reached') ?? false;

    return (
      <div className="menu-screen game-over">
        <h1 className={`title ${completedTerm ? '' : 'error'}`}>
          {completedTerm ? 'The Republic Endures' : 'Regime Collapse'}
        </h1>
        <h2 className="reason">{gameState.gameOverReason}</h2>
        <p className="summary">You governed {gameState.countryName} for {gameState.year - 1960} years (1960 - {gameState.year}).</p>

        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', margin: '30px 0', textAlign: 'left' }}>
          <div><strong>Final GDP:</strong> ${Math.round(gameState.country.gdp).toLocaleString()}M</div>
          <div><strong>Final Pop:</strong> {gameState.country.population.toFixed(1)}M</div>
          <div><strong>Stability:</strong> {Math.round(gameState.country.stability)}%</div>
          <div><strong>Debt:</strong> ${Math.round(gameState.country.externalDebt).toLocaleString()}M</div>
          <div><strong>Treasury:</strong> ${Math.round(gameState.treasury).toLocaleString()}M</div>
          <div><strong>Fiscal Balance:</strong> {gameState.lastFiscalBalance >= 0 ? '+' : '-'}${Math.abs(Math.round(gameState.lastFiscalBalance)).toLocaleString()}M/yr</div>
        </div>

        <div className="final-score" style={{ fontSize: '2rem', color: '#d4af37', borderTop: '1px solid #444', paddingTop: '20px' }}>
          Legacy Score: {score.total}
          <div className="score-breakdown">State {score.base} + Mission {score.missionBonus}</div>
        </div>

        <MissionPanel mission={mission} stats={gameState.country} />

        <Leaderboard />

        <button className="primary-button" onClick={() => setGameState(null)} style={{ marginTop: '30px' }}>Return to History</button>
      </div>
    );
  }

  // Removed old intro check logic since we do it before game start now

  const activeMission = NATIONAL_MISSIONS.find(item => item.id === gameState?.missionId) ?? NATIONAL_MISSIONS[0];
  const hasAvailableProject = DEVELOPMENT_PROJECTS.some(project => (gameState?.projectLevels[project.id] ?? 0) < project.maxLevel);
  const projectDue = !!gameState && gameState.year % 5 === 0 && gameState.lastProjectYear !== gameState.year && hasAvailableProject;
  const diplomacyDue = !!gameState && gameState.year >= 1965 && (gameState.year - 1965) % 10 === 0 && gameState.lastDiplomacyYear !== gameState.year;

  return (
    <div className="game-screen">
      <div className="header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', background: '#111', borderBottom: '1px solid #333' }}>
        <div className="country-name" style={{ color: '#d4af37', fontWeight: 'bold', fontSize: '1.2rem' }}>{gameState?.countryName}</div>
        <div className="state-resources">
          <div className="treasury-display">
            <span>Treasury</span>
            <strong>${Math.round(gameState!.treasury).toLocaleString()}M</strong>
            <small className={gameState!.lastFiscalBalance >= 0 ? 'positive' : 'negative'}>
              {gameState!.lastFiscalBalance >= 0 ? '+' : ''}${Math.round(gameState!.lastFiscalBalance)}M / yr
            </small>
          </div>
          <div className="artifacts-bar">
            {gameState?.artifacts.map(a => (
              <span key={a.id} className="artifact-tag" data-tooltip={a.description}>{a.name}</span>
            ))}
          </div>
        </div>
      </div>

      {lastOutcome && <OutcomeBanner outcome={lastOutcome} />}

      <NationOverview stats={gameState!.country} projects={DEVELOPMENT_PROJECTS} levels={gameState!.projectLevels} />

      <RegionalMap state={gameState!} partners={DIPLOMATIC_PARTNERS} />

      <MissionPanel mission={activeMission} stats={gameState!.country} />

      <CabinetPanel state={gameState!} />

      <Dashboard stats={gameState!.country} year={gameState!.year} />

      <TrendPanel history={gameState!.economicHistory} />

      <div className="controls">
        <button className="primary-button next-turn" onClick={handleNextTurn} disabled={!!currentEvent}>
          Advance Fiscal Year
        </button>
      </div>

      {currentEvent && !projectDue && !diplomacyDue && (
        <EventModal event={currentEvent} onOptionSelect={handleOptionSelect} />
      )}

      {projectDue && !diplomacyDue && (
        <ProjectModal
          projects={DEVELOPMENT_PROJECTS}
          levels={gameState!.projectLevels}
          year={gameState!.year}
          treasury={gameState!.treasury}
          canIssueBonds={gameState!.lastBondYear !== gameState!.year}
          onBuild={handleBuildProject}
          onIssueBonds={handleIssueBonds}
          onDefer={handleDeferPlan}
        />
      )}

      {diplomacyDue && (
        <DiplomacyModal
          partners={DIPLOMATIC_PARTNERS}
          relations={gameState!.neighborRelations}
          activePartnerId={gameState!.activePartnerId}
          year={gameState!.year}
          onSign={handleSignPact}
        />
      )}
    </div>
  );
}

export default App;
