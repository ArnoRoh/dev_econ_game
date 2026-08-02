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
import {
  INVESTMENT_STEP,
  applyProvincialPressure,
  buildProgramme,
  provinceRevenue,
  summariseProvinces,
  tickProvinces,
} from './engine/provinceLogic';
import { ProvinceMap } from './components/ProvinceMap';
import { answerKnowledgeCheck, headlineMetric, recordConceptExposure, scorePrediction, selectKnowledgeCheck, spendAdvisorInsight, summariseLearning } from './engine/learningLogic';
import { buildEndingContext, endingCitations, resolveEnding } from './engine/endingLogic';
import type {
  GameState,
  Artifact,
  DevelopmentProject,
  DiplomaticPartner,
  EducationalPolicyOption,
  KnowledgeCheck,
  PolicyProposal,
  ProgrammeId,
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
import type { PredictionChoice } from './components/PolicyDossier';
import { TurnDebrief } from './components/TurnDebrief';
import { FactionRail } from './components/FactionRail';
import { KnowledgeCheckModal } from './components/KnowledgeCheckModal';
import { PolicyLedger } from './components/PolicyLedger';
import { ChapterReport } from './components/ChapterReport';
import { SetupScreen } from './components/SetupScreen';
import { TitleScreen } from './components/TitleScreen';
import { AchievementToast } from './components/AchievementToast';
import { AchievementGallery } from './components/AchievementGallery';
import { checkAchievements } from './engine/achievementLogic';
import type { AchievementDef } from './data/achievements';
import { YearTransition } from './components/YearTransition';
import { StatCounter } from './components/StatCounter';
import { TurnPrimer } from './components/TurnPrimer';
import { SettingsPanel } from './components/SettingsPanel';
import { AdvisorRecords } from './components/AdvisorRecords';
import { CHARACTERS } from './data/characters';
import { initAudio, playCue } from './audio';
import { initReduceMotionPreference } from './settings';

import './components/Tooltip.css';
import './components/GameShell.css';

// Applied once, before the first render, so a returning player's motion
// preference never flashes in via an effect.
initReduceMotionPreference();

const APP_VERSION = '2.0.0';

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
  const [statsTab, setStatsTab] = useState<'nation' | 'region' | 'trends'>('nation');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [recordsOpen, setRecordsOpen] = useState(false);
  /** Which stage the player is looking at during the cabinet phase. */
  const [stageView, setStageView] = useState<'cabinet' | 'republic'>('cabinet');
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [freshAchievements, setFreshAchievements] = useState<AchievementDef[]>([]);
  /** Years being crossed, shown as a brief interstitial. */
  const [yearTurn, setYearTurn] = useState<{ from: number; to: number } | null>(null);
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
  /** The menu sits in front of setup so a run is never one stray click away. */
  const [atTitle, setAtTitle] = useState(true);

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
    state = tickProvinces(state);
    // The provinces' condition presses back on the centre: restive districts and a
    // widening regional gap cost national stability.
    state = applyProvincialPressure(state);

    // The provinces pay into the treasury, and a slice comes back as the
    // development budget the player allocates across them next year. Routing it
    // through a separate budget keeps province building from competing directly
    // with the cabinet's cash, which would make every year a false choice.
    const fromProvinces = provinceRevenue(state.provinces ?? [], state.country);
    state = {
      ...state,
      treasury: state.treasury + fromProvinces,
      provinceBudget: Math.round(fromProvinces * 0.6) + 20,
    };

    // Everything scheduled by earlier decisions lands here, before the player
    // is asked for anything new.
    state = resolveDueConsequences(state);
    state = resolveDuePromises(state);

    state = checkGameOver(state);
    if (state.gameOver) {
      handleGameOver(state);
      return;
    }

    // Evaluated once the year has fully resolved, so a milestone reached by a
    // delayed consequence is credited in the year it actually landed.
    const scored = checkAchievements(state);
    state = scored.state;
    if (scored.earned.length > 0) {
      setFreshAchievements(scored.earned);
      playCue('chime');
    }

    state = startAgendaTurn(state, ALL_POLICY_PROPOSALS);

    const crossedInto = state.year;
    setGameState(state);
    setDebriefEntries([]);
    setIgnoredTitles([]);
    playCue('year');

    // The page turn is the sound of the paper arriving; the warning is what is
    // printed on it. Bad news gets its own cue so the player hears that something
    // has gone wrong before they have finished reading the headline — and it
    // fires once for the edition, not once per bad story, which at four
    // consequences in a year would be an alarm rather than a warning.
    const headlines = newspaperForTurn(state, state.turn);
    if (headlines.length > 0) {
      playCue('page');
      if (headlines.some(item => item.tone === 'bad')) {
        window.setTimeout(() => playCue('warn'), 520);
      }
    }
    setTurnPhase(headlines.length > 0 ? 'newspaper' : 'agenda');
    setYearTurn({ from: crossedInto - 1, to: crossedInto });
  }, [handleGameOver]);

  const handleBuild = (provinceId: string, programmeId: ProgrammeId, cost: number) => {
    if (!gameState) return;
    const next = buildProgramme(gameState, provinceId, programmeId, cost);
    if (next !== gameState) {
      playCue('invest');
      setGameState(next);
    }
  };

  const handleOpenProposal = (proposalId: string) => {
    playCue('select');
    setOpenProposalId(proposalId);
    setTurnPhase('dossier');
  };

  const handleConfirmOption = (
    proposal: PolicyProposal,
    option: EducationalPolicyOption,
    prediction: PredictionChoice | null,
  ) => {
    if (!gameState) return;
    // The moment an action is actually spent — deliberately weighty.
    playCue('confirm');

    // Score the player's call against the option's own headline effect. Famine
    // risk and debt are inverted: a fall in either is an improvement.
    const metric = headlineMetric(option.effects);
    const lowerIsBetter = metric === 'famineRisk' || metric === 'externalDebt';
    const predictionCorrect =
      prediction && metric
        ? scorePrediction(prediction, option.effects[metric] ?? 0, lowerIsBetter)
        : undefined;

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
        ...(prediction ? { prediction, predictionMetric: metric ?? undefined, predictionCorrect } : {}),
      },
    ]);

    if (predictionCorrect) {
      const progress = { ...(next.conceptProgress ?? {}) };
      for (const id of option.conceptIds) {
        const current = progress[id];
        if (current) progress[id] = { ...current, correctPredictions: current.correctPredictions + 1 };
      }
      next = { ...next, conceptProgress: progress };
    }

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

  if (!gameState && !isNaming && atTitle) {
    return (
      <>
      <TitleScreen
        hasActiveSave={hasActiveSave}
        onContinue={() => { initAudio(); setAtTitle(false); continueSavedGame(); }}
        onNewGame={() => { initAudio(); setAtTitle(false); }}
        onOpenAchievements={() => setGalleryOpen(true)}
        version={APP_VERSION}
      />
      {galleryOpen && <AchievementGallery state={gameState} onClose={() => setGalleryOpen(false)} />}
      </>
    );
  }

  if (!gameState && !isNaming) {
    return (
      <SetupScreen
        artifacts={ARTIFACTS}
        selectedArtifacts={selectedArtifacts}
        onToggleArtifact={toggleArtifact}
        missions={NATIONAL_MISSIONS}
        selectedMissionId={selectedMissionId}
        onSelectMission={setSelectedMissionId}
        pointsRemaining={pointsRemaining}
        pointsBudget={POINTS_BUDGET}
        canRatify={isValidSelection && selectedArtifacts.length > 0 && !!selectedMissionId}
        onRatify={startNaming}
        hasActiveSave={hasActiveSave}
        onContinue={continueSavedGame}
      />
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
          onRestart={() => { setGameState(null); setLedgerOpen(false); setAtTitle(true); }}
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

  const provinceStanding = summariseProvinces(state.provinces ?? []);

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
            <StatCounter value={state.treasury} format="currency" />
            <small className={state.lastFiscalBalance >= 0 ? 'positive' : 'negative'}>
              {state.lastFiscalBalance >= 0 ? '+' : ''}${Math.round(state.lastFiscalBalance)}M/yr
            </small>
          </span>
          <span className="shell-meter">
            <span className="shell-meter-label">Stability</span>
            <StatCounter value={state.country.stability} format="percent" />
          </span>
          <span className="shell-meter">
            <span className="shell-meter-label">Debt</span>
            <StatCounter value={state.country.externalDebt} format="currency" lowerIsBetter />
          </span>
          <span className="shell-meter">
            <span className="shell-meter-label">Insight</span>
            <StatCounter value={state.advisorInsight ?? 0} />
          </span>
          <span
            className="shell-meter"
            title="Spread between the best and worst developed province. A widening gap is what turns regional grievance into a secession problem."
          >
            <span className="shell-meter-label">Regional gap</span>
            <StatCounter value={provinceStanding.developmentGap} lowerIsBetter />
          </span>
        </div>

        <nav className="shell-nav">
          <button type="button" onClick={() => setStatsOpen(open => !open)}>
            {statsOpen ? 'Hide' : 'Statistics Office'}
          </button>
          <button type="button" onClick={() => setLedgerOpen(true)}>
            Archive ({(state.policyDecisions ?? []).length})
          </button>
          <button type="button" onClick={() => setRecordsOpen(true)}>
            Who was right
          </button>
          <button type="button" onClick={() => setGalleryOpen(true)}>
            Records ({(state.achievements ?? []).length})
          </button>
          <button type="button" onClick={() => setSettingsOpen(true)} aria-label="Settings">
            ⚙ Settings
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

          {turnPhase === 'agenda' && !milestoneDue && (
            <div className="stage-switch" role="tablist" aria-label="View">
              {([
                ['cabinet', 'Cabinet table'],
                ['republic', 'The republic'],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={stageView === id}
                  className={`stage-switch-tab${stageView === id ? ' is-active' : ''}`}
                  onClick={() => setStageView(id)}
                >
                  {label}
                  {id === 'republic' && (state.provinceBudget ?? 0) >= INVESTMENT_STEP && (
                    <span className="stage-switch-dot" aria-label="Development budget unspent" />
                  )}
                </button>
              ))}
            </div>
          )}

          {turnPhase === 'agenda' && !milestoneDue && stageView === 'republic' && (
            <ProvinceMap
              provinces={state.provinces ?? []}
              year={state.year}
              budget={state.provinceBudget ?? 0}
              investmentStep={INVESTMENT_STEP}
              selectedId={selectedProvince}
              onSelect={setSelectedProvince}
              onBuild={handleBuild}
            />
          )}

          {turnPhase === 'agenda' && !milestoneDue && stageView === 'cabinet' && state.turn <= 1 && !primerDismissed && (
            <TurnPrimer
              onDismiss={() => {
                localStorage.setItem('dev_econ_primer_seen', '1');
                setPrimerDismissed(true);
              }}
            />
          )}

          {turnPhase === 'agenda' && !milestoneDue && stageView === 'cabinet' && (
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
              onConfirm={(option, prediction) => handleConfirmOption(openProposal, option, prediction)}
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
          <div className="stats-tabs" role="tablist" aria-label="Statistics office sections">
            {([
              ['nation', 'The Nation'],
              ['region', 'Region & Mission'],
              ['trends', 'Trends'],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`stats-tab-${id}`}
                aria-selected={statsTab === id}
                aria-controls={`stats-panel-${id}`}
                className={`stats-tab${statsTab === id ? ' is-active' : ''}`}
                onClick={() => setStatsTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {statsTab === 'nation' && (
            <div role="tabpanel" id="stats-panel-nation" aria-labelledby="stats-tab-nation">
              <NationOverview stats={state.country} projects={DEVELOPMENT_PROJECTS} levels={state.projectLevels} />
              <Dashboard stats={state.country} year={state.year} />
              <CabinetPanel state={state} />
            </div>
          )}

          {statsTab === 'region' && (
            <div role="tabpanel" id="stats-panel-region" aria-labelledby="stats-tab-region">
              <RegionalMap state={state} partners={DIPLOMATIC_PARTNERS} />
              <MissionPanel mission={activeMission} stats={state.country} />
            </div>
          )}

          {statsTab === 'trends' && (
            <div role="tabpanel" id="stats-panel-trends" aria-labelledby="stats-tab-trends">
              <TrendPanel history={state.economicHistory} />
            </div>
          )}
        </section>
      )}

      {galleryOpen && <AchievementGallery state={state} onClose={() => setGalleryOpen(false)} />}

      {recordsOpen && (
        <AdvisorRecords
          characters={CHARACTERS}
          audits={state.forecastAudits ?? []}
          onClose={() => setRecordsOpen(false)}
        />
      )}

      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}

      <AchievementToast
        key={freshAchievements[0]?.id ?? 'none'}
        achievements={freshAchievements}
        onDismiss={() => setFreshAchievements([])}
      />

      {yearTurn && (
        <YearTransition
          fromYear={yearTurn.from}
          toYear={yearTurn.to}
          onDone={() => setYearTurn(null)}
        />
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
