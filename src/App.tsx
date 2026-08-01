import { useCallback, useEffect, useState } from 'react';
import { createInitialState, advanceTurn, buildProject, checkGameOver, deferDevelopmentPlan, issueDevelopmentBonds, remainNonAligned, signDiplomaticPact } from './engine/gameLogic';
import { calculateLegacyScore } from './engine/missionLogic';
import {
  confirmProposal,
  ignoreRemainingProposals,
  rejectProposal,
  startAgendaTurn,
} from './engine/agendaLogic';
import { newspaperForTurn, resolveDueConsequences, resolveDuePromises } from './engine/consequenceLogic';
import { driftFactions } from './engine/factionLogic';
import { answerKnowledgeCheck, recordConceptExposure, selectKnowledgeCheck, spendAdvisorInsight, summariseLearning } from './engine/learningLogic';
import { buildEndingContext, endingCitations, resolveEnding } from './engine/endingLogic';
import type {
  GameState,
  Artifact,
  DevelopmentProject,
  DiplomaticPartner,
  EducationalPolicyOption,
  KnowledgeCheck,
  PolicyProposal,
  TurnDebriefEntry,
  TurnPhase,
} from './engine/types';
import { ARTIFACTS } from './data/artifacts';
import { ALL_POLICY_PROPOSALS } from './data/arcs';
import { ECONOMIC_CONCEPTS } from './data/concepts';
import { NATIONAL_MISSIONS } from './data/missions';
import { DEVELOPMENT_PROJECTS } from './data/projects';
import { DIPLOMATIC_PARTNERS } from './data/diplomacy';
import { Dashboard } from './components/Dashboard';
import { IntroModal } from './components/IntroModal';
import { Leaderboard } from './components/Leaderboard';
import type { LeaderboardEntry } from './components/Leaderboard';
import { MissionPanel } from './components/MissionPanel';
import { NationOverview } from './components/NationOverview';
import { ProjectModal } from './components/ProjectModal';
import { CabinetPanel } from './components/CabinetPanel';
import { clearSavedRun, hasSavedRun, loadRun, saveRun } from './saveGame';
import { RegionalMap } from './components/RegionalMap';
import { DiplomacyModal } from './components/DiplomacyModal';
import { TrendPanel } from './components/TrendPanel';
import { Newspaper } from './components/Newspaper';
import { CabinetAgenda } from './components/CabinetAgenda';
import { PolicyDossier } from './components/PolicyDossier';
import { TurnDebrief } from './components/TurnDebrief';
import { FactionRail } from './components/FactionRail';
import { KnowledgeCheckModal } from './components/KnowledgeCheckModal';
import { PolicyLedger } from './components/PolicyLedger';
import { ChapterReport } from './components/ChapterReport';
import { TurnPrimer } from './components/TurnPrimer';

import './components/Tooltip.css';
import './components/GameShell.css';

const PROPOSALS_BY_ID = new Map<string, PolicyProposal>(
  ALL_POLICY_PROPOSALS.map(proposal => [proposal.id, proposal]),
);

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [hasActiveSave, setHasActiveSave] = useState(() => hasSavedRun());

  // --- cabinet turn loop -----------------------------------------------------
  const [turnPhase, setTurnPhase] = useState<TurnPhase>('agenda');
  const [openProposalId, setOpenProposalId] = useState<string | null>(null);
  const [debriefEntries, setDebriefEntries] = useState<TurnDebriefEntry[]>([]);
  const [ignoredTitles, setIgnoredTitles] = useState<string[]>([]);
  const [pendingCheck, setPendingCheck] = useState<KnowledgeCheck | null>(null);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [primerDismissed, setPrimerDismissed] = useState(
    () => localStorage.getItem('dev_econ_primer_seen') === '1',
  );

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
    saveRun({ gameState, currentEvent: null, lastOutcome: null, turnPhase });
  }, [gameState, turnPhase]);

  const startNaming = () => {
    if (!isValidSelection || selectedArtifacts.length === 0 || !selectedMissionId) return;
    setIsNaming(true);
  }

  const finalizeGameStart = (name: string) => {
    if (!selectedMissionId) return;
    const initial = createInitialState(selectedArtifacts, name, selectedMissionId, DIPLOMATIC_PARTNERS);
    setGameState(startAgendaTurn(initial, ALL_POLICY_PROPOSALS));
    setTurnPhase('agenda');
    setDebriefEntries([]);
    setIgnoredTitles([]);
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

    // A save from before the cabinet loop has no agenda; open one so the
    // restored run lands on a playable screen rather than an empty table.
    const restored = (saved.gameState.agendaProposalIds ?? []).length > 0
      ? saved.gameState
      : startAgendaTurn(saved.gameState, ALL_POLICY_PROPOSALS);

    setGameState(restored);
    setTurnPhase(saved.turnPhase === 'dossier' ? 'agenda' : (saved.turnPhase ?? 'agenda'));
    setOpenProposalId(null);
    setDebriefEntries([]);
    setIgnoredTitles([]);
    setIsNaming(false);
  };

  const handleGameOver = useCallback((finalState: GameState) => {
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
  }, []);

  /** Advance the world by one year and open the next cabinet session. */
  const runYear = useCallback((fromState: GameState) => {
    let state = checkGameOver(fromState);
    if (state.gameOver) {
      handleGameOver(state);
      return;
    }

    state = advanceTurn(state, DEVELOPMENT_PROJECTS, DIPLOMATIC_PARTNERS);
    state = driftFactions(state);

    // Everything scheduled by earlier decisions lands here, before the player
    // is asked for anything new.
    state = resolveDueConsequences(state);
    state = resolveDuePromises(state);

    state = checkGameOver(state);
    if (state.gameOver) {
      handleGameOver(state);
      return;
    }

    state = startAgendaTurn(state, ALL_POLICY_PROPOSALS);

    setGameState(state);
    setDebriefEntries([]);
    setIgnoredTitles([]);

    const headlines = newspaperForTurn(state, state.turn);
    setTurnPhase(headlines.length > 0 ? 'newspaper' : 'agenda');
  }, [handleGameOver]);

  const handleOpenProposal = (proposalId: string) => {
    setOpenProposalId(proposalId);
    setTurnPhase('dossier');
  };

  const handleConfirmOption = (proposal: PolicyProposal, option: EducationalPolicyOption) => {
    if (!gameState) return;

    let next = confirmProposal(gameState, proposal, option);
    next = recordConceptExposure(next, option.conceptIds);

    // Park the authored forecasts so the archive can score them later.
    const decision = (next.policyDecisions ?? [])[(next.policyDecisions ?? []).length - 1];
    if (decision) {
      next = {
        ...next,
        forecastAudits: [
          ...(next.forecastAudits ?? []),
          ...option.forecasts.map(forecast => ({
            decisionId: decision.id,
            advisorId: forecast.advisorId,
            summary: forecast.summary,
            predictedDirection: forecast.predictedDirection,
            confidence: forecast.confidence,
            affectedMetric: forecast.affectedMetric,
          })),
        ],
      };
    }

    setDebriefEntries(entries => [
      ...entries,
      {
        decisionId: decision?.id ?? proposal.id,
        proposalTitle: proposal.title,
        optionText: option.text,
        sponsorId: proposal.sponsorId,
        narrative: option.immediateNarrative,
        effects: option.effects,
        treasuryEffect: option.treasuryEffect,
        factionEffects: option.factionEffects,
        conceptIds: option.conceptIds,
        watchFor: option.delayedConsequences.map(consequence => consequence.headline),
      },
    ]);

    setGameState(next);
    setOpenProposalId(null);
    setTurnPhase('agenda');
  };

  const handleRejectProposal = (proposal: PolicyProposal) => {
    if (!gameState) return;
    setGameState(rejectProposal(gameState, proposal));
    setOpenProposalId(null);
    setTurnPhase('agenda');
  };

  const handleEndSession = () => {
    if (!gameState) return;

    const remaining = (gameState.agendaProposalIds ?? [])
      .map(id => PROPOSALS_BY_ID.get(id)?.title)
      .filter((title): title is string => Boolean(title));

    setIgnoredTitles(remaining);
    setGameState(ignoreRemainingProposals(gameState, ALL_POLICY_PROPOSALS));
    setTurnPhase('debrief');
  };

  const handleDebriefContinue = () => {
    if (!gameState) return;

    const check = selectKnowledgeCheck(gameState);
    if (check) {
      setPendingCheck(check);
      setTurnPhase('knowledge');
      return;
    }

    runYear(gameState);
  };

  const handleAnswerCheck = (answerId: string) => {
    if (!gameState || !pendingCheck) return;
    const { state } = answerKnowledgeCheck(gameState, pendingCheck, answerId);
    setGameState(state);
  };

  const handleCloseCheck = () => {
    setPendingCheck(null);
    if (gameState) runYear(gameState);
  };

  /**
   * Keyboard control for the whole turn loop. Enter or Space always advances
   * the phase the player is in; Escape backs out of a dossier; number keys open
   * the corresponding proposal. Typing in a field is never intercepted.
   */
  useEffect(() => {
    if (!gameState || gameState.gameOver) return;

    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === 'Escape') {
        if (ledgerOpen) { setLedgerOpen(false); event.preventDefault(); return; }
        if (turnPhase === 'dossier') {
          setOpenProposalId(null);
          setTurnPhase('agenda');
          event.preventDefault();
        }
        return;
      }

      if (event.key !== 'Enter' && event.key !== ' ') {
        const index = Number(event.key);
        if (turnPhase === 'agenda' && index >= 1 && index <= 9) {
          const id = (gameState.agendaProposalIds ?? [])[index - 1];
          if (id && (gameState.actionsRemaining ?? 0) > 0) {
            handleOpenProposal(id);
            event.preventDefault();
          }
        }
        return;
      }

      // Enter/Space: the single forward move for this phase.
      if (turnPhase === 'newspaper') { setTurnPhase('agenda'); event.preventDefault(); }
      else if (turnPhase === 'agenda') { handleEndSession(); event.preventDefault(); }
      else if (turnPhase === 'debrief') { handleDebriefContinue(); event.preventDefault(); }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

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
      handleGameOver(nextState);
    } else {
      setGameState(nextState);
    }
  };

  const handleDeclineDiplomacy = () => {
    if (!gameState) return;
    const nextState = remainNonAligned(gameState);
    if (nextState === gameState) return;

    setGameState({
      ...nextState,
      chronicle: [
        ...nextState.chronicle,
        {
          id: `${nextState.year}-diplomacy-nonaligned`,
          year: nextState.year,
          category: 'diplomacy',
          title: 'Regional Summit',
          decision: 'Remained non-aligned',
          effects: { internationalRelations: -4, stability: 2 },
        },
      ],
    });
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
    const ending = resolveEnding(buildEndingContext(gameState));
    const learning = summariseLearning(gameState, ECONOMIC_CONCEPTS.length);

    return (
      <div className="menu-screen game-over">
        <ChapterReport
          state={gameState}
          ending={ending}
          citations={endingCitations(gameState)}
          learning={learning}
          legacyScore={score.total}
          onOpenLedger={() => setLedgerOpen(true)}
          onRestart={() => { setGameState(null); setLedgerOpen(false); }}
        />

        <MissionPanel mission={mission} stats={gameState.country} />
        <Leaderboard />

        {ledgerOpen && (
          <PolicyLedger
            decisions={gameState.policyDecisions ?? []}
            newspaper={gameState.newspaper ?? []}
            promises={gameState.promises ?? []}
            audits={gameState.forecastAudits ?? []}
            onClose={() => setLedgerOpen(false)}
          />
        )}
      </div>
    );
  }

  const state = gameState!;
  const activeMission = NATIONAL_MISSIONS.find(item => item.id === state.missionId) ?? NATIONAL_MISSIONS[0];
  const hasAvailableProject = DEVELOPMENT_PROJECTS.some(project => (state.projectLevels[project.id] ?? 0) < project.maxLevel);
  const projectDue = state.year % 5 === 0 && state.lastProjectYear !== state.year && hasAvailableProject;
  const diplomacyDue = state.year >= 1965 && (state.year - 1965) % 10 === 0 && state.lastDiplomacyYear !== state.year;
  const milestoneDue = projectDue || diplomacyDue;

  const agenda = (state.agendaProposalIds ?? [])
    .map(id => PROPOSALS_BY_ID.get(id))
    .filter((proposal): proposal is PolicyProposal => Boolean(proposal));
  const openProposal = openProposalId ? PROPOSALS_BY_ID.get(openProposalId) ?? null : null;
  const headlines = newspaperForTurn(state, state.turn);

  return (
    <div className="game-screen shell">
      <header className="shell-bar">
        <div className="shell-identity">
          <span className="shell-country">{state.countryName}</span>
          <span className="shell-year">{state.year}</span>
        </div>

        <div className="shell-meters">
          <span className="shell-meter">
            <span className="shell-meter-label">Treasury</span>
            <strong>${Math.round(state.treasury).toLocaleString()}M</strong>
            <small className={state.lastFiscalBalance >= 0 ? 'positive' : 'negative'}>
              {state.lastFiscalBalance >= 0 ? '+' : ''}${Math.round(state.lastFiscalBalance)}M/yr
            </small>
          </span>
          <span className="shell-meter">
            <span className="shell-meter-label">Stability</span>
            <strong>{Math.round(state.country.stability)}%</strong>
          </span>
          <span className="shell-meter">
            <span className="shell-meter-label">Insight</span>
            <strong>{state.advisorInsight ?? 0}</strong>
          </span>
        </div>

        <nav className="shell-nav">
          <button type="button" onClick={() => setStatsOpen(open => !open)}>
            {statsOpen ? 'Hide' : 'Statistics Office'}
          </button>
          <button type="button" onClick={() => setLedgerOpen(true)}>
            Archive ({(state.policyDecisions ?? []).length})
          </button>
        </nav>
      </header>

      <div className="shell-body">
        <main className="shell-stage">
          {turnPhase === 'newspaper' && (
            <Newspaper
              countryName={state.countryName}
              year={state.year}
              items={headlines}
              onContinue={() => setTurnPhase('agenda')}
            />
          )}

          {turnPhase === 'agenda' && !milestoneDue && state.turn <= 1 && !primerDismissed && (
            <TurnPrimer
              onDismiss={() => {
                localStorage.setItem('dev_econ_primer_seen', '1');
                setPrimerDismissed(true);
              }}
            />
          )}

          {turnPhase === 'agenda' && !milestoneDue && (
            <CabinetAgenda
              year={state.year}
              proposals={agenda}
              actionsRemaining={state.actionsRemaining ?? 0}
              characters={state.characters}
              decisions={state.policyDecisions ?? []}
              audits={state.forecastAudits ?? []}
              onOpen={handleOpenProposal}
              onEndSession={handleEndSession}
            />
          )}

          {turnPhase === 'dossier' && openProposal && (
            <PolicyDossier
              proposal={openProposal}
              characters={state.characters}
              advisorInsight={state.advisorInsight ?? 0}
              onSpendInsight={() => setGameState(spendAdvisorInsight(state))}
              onConfirm={option => handleConfirmOption(openProposal, option)}
              onReject={() => handleRejectProposal(openProposal)}
              onBack={() => { setOpenProposalId(null); setTurnPhase('agenda'); }}
            />
          )}

          {turnPhase === 'debrief' && (
            <TurnDebrief
              year={state.year}
              entries={debriefEntries}
              ignoredTitles={ignoredTitles}
              onContinue={handleDebriefContinue}
            />
          )}
        </main>

        <FactionRail
          factions={state.factions}
          characters={state.characters}
          promises={state.promises ?? []}
          turn={state.turn}
        />
      </div>

      {statsOpen && (
        <section className="shell-stats" aria-label="Statistics office">
          <NationOverview stats={state.country} projects={DEVELOPMENT_PROJECTS} levels={state.projectLevels} />
          <RegionalMap state={state} partners={DIPLOMATIC_PARTNERS} />
          <MissionPanel mission={activeMission} stats={state.country} />
          <CabinetPanel state={state} />
          <Dashboard stats={state.country} year={state.year} />
          <TrendPanel history={state.economicHistory} />
        </section>
      )}

      {pendingCheck && (
        <KnowledgeCheckModal
          check={pendingCheck}
          onAnswer={handleAnswerCheck}
          onClose={handleCloseCheck}
        />
      )}

      {ledgerOpen && (
        <PolicyLedger
          decisions={state.policyDecisions ?? []}
          newspaper={state.newspaper ?? []}
          promises={state.promises ?? []}
          audits={state.forecastAudits ?? []}
          onClose={() => setLedgerOpen(false)}
        />
      )}

      {projectDue && !diplomacyDue && (
        <ProjectModal
          projects={DEVELOPMENT_PROJECTS}
          levels={state.projectLevels}
          year={state.year}
          treasury={state.treasury}
          canIssueBonds={state.lastBondYear !== state.year}
          onBuild={handleBuildProject}
          onIssueBonds={handleIssueBonds}
          onDefer={handleDeferPlan}
        />
      )}

      {diplomacyDue && (
        <DiplomacyModal
          partners={DIPLOMATIC_PARTNERS}
          relations={state.neighborRelations}
          activePartnerId={state.activePartnerId}
          year={state.year}
          onSign={handleSignPact}
          onDecline={handleDeclineDiplomacy}
        />
      )}
    </div>
  );
}

export default App;
