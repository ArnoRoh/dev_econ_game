export interface CountryStats {
    gdp: number; // In millions USD
    gdpGrowthRate: number; // Percentage
    population: number; // In millions
    stability: number; // 0-100
    eliteSatisfaction: number; // 0-100
    militaryPower: number; // 0-100
    educationLevel: number; // 0-100
    famineRisk: number; // 0-100
    internationalRelations: number; // 0-100
    genderEquality: number; // 0-100% (New v1.5 stat)
    externalDebt: number; // In millions USD
    popGrowthRate?: number; // v2.0: Tracked for UI display
}

export interface Artifact {
    id: string;
    name: string;
    description: string;
    effects: Partial<CountryStats>;
    pointCost: number; // Cost in selection points (can be negative)
    tags?: string[]; // For weighted event probabilities
}

export type StatKey = keyof CountryStats;

export type FactionId = 'military' | 'labor' | 'business' | 'provincial';
export type CharacterId = 'finance_minister' | 'army_chief' | 'labor_leader' | 'provincial_chair';
export type ConceptId =
    | 'land_tenure'
    | 'green_revolution'
    | 'import_substitution'
    | 'export_orientation'
    | 'infant_industry'
    | 'labor_standards'
    | 'dutch_disease'
    | 'sovereign_wealth_fund'
    | 'resource_curse';

export interface SourceCitation {
    id: string;
    title: string;
    author: string;
    year?: number;
    publisher?: string;
    url?: string;
    sourceType: 'paper' | 'book' | 'institution' | 'teaching' | 'caseStudy';
}

export interface EconomicConcept {
    id: ConceptId;
    title: string;
    oneSentenceSummary: string;
    mechanismSteps: string[];
    assumptions: string[];
    commonMisconceptions: string[];
    competingViews: string[];
    observableIndicators: Array<keyof CountryStats | 'treasury' | 'factionPower'>;
    sourceIds: string[];
}

export interface FactionDefinition {
    id: FactionId;
    name: string;
    shortName: string;
    description: string;
    leaderId: CharacterId;
    priorities: string[];
    redLines: string[];
}

export interface FactionState {
    support: number;
    power: number;
    radicalization: number;
    promisesOwed: string[];
    grievances: string[];
}

export interface CharacterDefinition {
    id: CharacterId;
    name: string;
    title: string;
    factionId: FactionId;
    publicGoal: string;
    privateGoal: string;
    portrait?: string;
}

export interface CharacterState {
    trust: number;
    influence: number;
    loyalty: number;
    memories: string[];
}

export interface QualitativeForecast {
    advisorId: CharacterId;
    summary: string;
    predictedDirection: 'stronglyDown' | 'down' | 'mixed' | 'up' | 'stronglyUp';
    confidence: 'low' | 'medium' | 'high';
    affectedMetric?: keyof CountryStats | 'treasury';
    hiddenBias?: string;
}

export interface FactionEffect {
    factionId: FactionId;
    support?: number;
    power?: number;
    radicalization?: number;
    grievance?: string;
}

export interface DelayedConsequenceSpec {
    id: string;
    delayTurns: number;
    headline: string;
    narrative: string;
    effects: Partial<CountryStats>;
    treasuryEffect?: number;
    factionEffects?: FactionEffect[];
    requiredFlags?: string[];
    blockedByFlags?: string[];
    setsFlags?: string[];
    conceptIds: ConceptId[];
}

/** A commitment an option makes on the government's behalf. */
export interface PromiseSpec {
    id: string;
    description: string;
    factionId: FactionId;
    /** Years the government has to deliver before the promise is judged. */
    deadlineTurns: number;
    /** Flag that, if set by the deadline, counts as delivery. */
    completionFlag: string;
}

export interface EducationalPolicyOption {
    id: string;
    text: string;
    rationale: string;
    immediateNarrative: string;
    effects: Partial<CountryStats>;
    treasuryEffect?: number;
    factionEffects: FactionEffect[];
    forecasts: QualitativeForecast[];
    conceptIds: ConceptId[];
    sourceIds: string[];
    delayedConsequences: DelayedConsequenceSpec[];
    setFlags?: string[];
    /** Choosing this option publicly commits the government to something. */
    createsPromise?: PromiseSpec;
}

export interface PolicyProposal {
    id: string;
    arcId: string;
    arcStep: number;
    title: string;
    sponsorId: CharacterId;
    brief: string;
    stakeholderSummary: string;
    conceptIds: ConceptId[];
    sourceIds: string[];
    options: EducationalPolicyOption[];
    ignoreOutcome: DelayedConsequenceSpec;
    minYear?: number;
    maxYear?: number;
    requiredFlags?: string[];
    blockedByFlags?: string[];
    /**
     * Generic proposals fill an agenda when no authored arc step is live. Arc
     * steps always outrank them in selection.
     */
    isGeneric?: boolean;
    /**
     * Long-form economics note used when a proposal has no mapped concept. This
     * carries the original event corpus's theory text into the dossier.
     */
    backgroundTheory?: string;
    wikiLink?: string;
    /** Legacy citation string, kept when there is no structured source. */
    legacySource?: string;
    /** May appear again in later years. Most proposals resolve permanently. */
    repeatable?: boolean;
    /** Subject tags, used to pick an emblem. */
    tags?: string[];
}

export type Terrain = 'delta' | 'highland' | 'river' | 'savannah' | 'coast' | 'forest' | 'border';

/**
 * What an allocation of the development budget can be spent on. The union lives
 * here rather than in `src/data` so the engine can reason about programmes
 * without importing authored content.
 */
export type ProgrammeId = 'roads' | 'schools' | 'extraction' | 'irrigation';

/**
 * A province of the republic. This is the territorial layer the player builds:
 * investment raises development, neglect raises unrest, and the gap between the
 * best and worst province is what turns a country into a secession problem.
 */
export interface Province {
    id: string;
    name: string;
    blurb: string;
    terrain: Terrain;
    /** The community that predominates here. */
    group: string;
    /** Share of national population, 0-1. */
    popShare: number;
    /** Local development level, 0-100. */
    development: number;
    /** Local unrest, 0-100. */
    unrest: number;
    /** Endowments, 0-100. */
    minerals: number;
    farmland: number;
    coastal: boolean;
    /** SVG polygon points inside a 100x100 viewBox. */
    shape: string;
    /** Label anchor inside the polygon. */
    cx: number;
    cy: number;
    /** Cumulative investment, $M. */
    invested: number;
    /** Year the province last received investment, for UI feedback. */
    lastInvestedYear?: number;
    /**
     * How many times each development programme has been built here. Absent on
     * provinces from before programmes existed, which reads as none built and
     * leaves their simulation identical to what it was.
     */
    works?: Partial<Record<ProgrammeId, number>>;
}

/** Year-over-year change in a province's condition. */
export interface ProvinceDelta {
    development: number; // Signed change since the previous year
    unrest: number;
    minerals: number;
}

/** National roll-up of the territorial layer. */
export interface ProvinceSummary {
    meanDevelopment: number;
    /** Spread between best and worst province — the regional-inequality signal. */
    developmentGap: number;
    meanUnrest: number;
    /** Province most in need of attention. */
    neglectedId: string | null;
    /** Provinces at risk of open revolt. */
    restiveIds: string[];
}

export interface ScheduledConsequence {
    id: string;
    sourceDecisionId: string;
    dueTurn: number;
    spec: DelayedConsequenceSpec;
}

export interface PlayerPrediction {
    questionId: string;
    selectedAnswerId: string;
    createdTurn: number;
}

export interface PolicyDecisionRecord {
    id: string;
    turn: number;
    year: number;
    proposalId: string;
    proposalTitle: string;
    sponsorId: CharacterId;
    status: 'chosen' | 'ignored' | 'rejected' | 'reversed';
    optionId?: string;
    optionText?: string;
    prediction?: PlayerPrediction;
    immediateEffects: Partial<CountryStats>;
    treasuryEffect?: number;
    factionEffects: FactionEffect[];
    conceptIds: ConceptId[];
    sourceIds: string[];
    scheduledConsequenceIds: string[];
    resolvedConsequenceIds: string[];
}

export interface PromiseRecord {
    id: string;
    madeTurn: number;
    factionId: FactionId;
    description: string;
    deadlineTurn: number;
    completionFlag: string;
    status: 'active' | 'kept' | 'broken';
}

export interface ConceptProgress {
    exposures: number;
    correctPredictions: number;
    correctKnowledgeChecks: number;
    lastSeenTurn: number;
}

export interface KnowledgeCheck {
    id: string;
    conceptId: ConceptId;
    prompt: string;
    answers: Array<{ id: string; text: string }>;
    correctAnswerId: string;
    explanation: string;
}

export type MissionMetric = StatKey | 'gdpPerCapita';

export interface MissionGoal {
    metric: MissionMetric;
    label: string;
    target: number;
    direction: 'atLeast' | 'atMost';
    format: 'number' | 'percent' | 'currency';
}

export interface NationalMission {
    id: string;
    name: string;
    description: string;
    goals: MissionGoal[];
}

export interface DevelopmentProject {
    id: string;
    name: string;
    icon: string;
    description: string;
    treasuryCost: number;
    effects: Partial<CountryStats>;
    annualEffects: Partial<CountryStats>;
    maxLevel: number;
}

export interface EconomicSnapshot {
    year: number;
    gdp: number;
    stability: number;
    educationLevel: number;
    famineRisk: number;
    externalDebt: number;
}

export interface DiplomaticPartner {
    id: string;
    name: string;
    shortName: string;
    position: 'north' | 'east' | 'south' | 'west';
    pactName: string;
    description: string;
    doctrine: string;
    initialRelations: number;
    pactEffects: Partial<CountryStats>;
    annualEffects: Partial<CountryStats>;
}

export interface ChronicleEntry {
    id: string;
    year: number;
    category: 'policy' | 'project' | 'diplomacy';
    title: string;
    decision: string;
    effects: Partial<CountryStats>;
}

export interface DecisionOutcome {
    eventTitle: string;
    optionText: string;
    explanation?: string;
    effects: Partial<CountryStats>;
}

export interface EventOption {
    text: string;
    effects: Partial<CountryStats>; // Immediate effect (delta)
    explanation?: string; // New v1.5: Tooltip explaining the economic reasoning
    setFlags?: string[]; // v1.6: Sets narrative flags (e.g. 'allowed_sweatshops')
}

export interface GameEvent {
    id: string;
    title: string;
    description: string;
    options: EventOption[];
    minYear?: number;
    theory?: string; // Educational context explaining the economic principle
    source?: string; // Basic citation or concept name
    image?: string; // Path to image asset
    tags?: string[]; // Matches artifact tags
    reqFlags?: string[]; // v1.6: Only trigger if these flags exist
    wikiLink?: string; // v1.6: Link to Wikipedia for deep learning
    maxYear?: number; // v1.9: Event stops triggering after this year
}

/**
 * A consequence that has landed. The newspaper is how the player discovers that
 * a choice made four years ago has finally arrived, which is the whole point of
 * the delayed-consequence system.
 */
export interface NewspaperItem {
    id: string;
    turn: number;
    year: number;
    headline: string;
    narrative: string;
    effects: Partial<CountryStats>;
    treasuryEffect?: number;
    conceptIds: ConceptId[];
    /** The decision this traces back to, so the ledger can link both ways. */
    sourceDecisionId: string;
    sourceTitle?: string;
    /** How the originating decision was taken. */
    origin: 'chosen' | 'ignored' | 'rejected' | 'promise';
    tone: 'good' | 'bad' | 'mixed';
}

/**
 * A forecast recorded at decision time, checked against reality when the
 * delayed consequence lands. This drives the "were my advisors right?" loop.
 */
export interface ForecastAudit {
    decisionId: string;
    advisorId: CharacterId;
    summary: string;
    predictedDirection: QualitativeForecast['predictedDirection'];
    confidence: QualitativeForecast['confidence'];
    affectedMetric?: keyof CountryStats | 'treasury';
    /** Filled in once the outcome is observable. */
    observedDelta?: number;
    verdict?: 'right' | 'wrong' | 'partial';
}

/** The phases a single turn moves through. */
export type TurnPhase =
    | 'newspaper'
    | 'agenda'
    | 'dossier'
    | 'debrief'
    | 'knowledge'
    | 'milestone';

export interface TurnDebriefEntry {
    decisionId: string;
    proposalTitle: string;
    optionText: string;
    sponsorId: CharacterId;
    narrative: string;
    effects: Partial<CountryStats>;
    treasuryEffect?: number;
    factionEffects: FactionEffect[];
    conceptIds: ConceptId[];
    /** What to watch for in later years. */
    watchFor: string[];
    /** The player's pre-decision call, and whether it held up. */
    prediction?: 'up' | 'down' | 'mixed';
    predictionMetric?: keyof CountryStats;
    predictionCorrect?: boolean;
}

export interface GameState {
    country: CountryStats;
    year: number;
    turn: number;
    artifacts: Artifact[];
    gameOver: boolean;
    gameOverReason?: string; // Relaxed from specific union type to allow diverse reasons
    flags: Record<string, boolean>; // v1.6: Persistent narrative flags
    countryName: string; // v2.1: Customizable country name
    missionId: string;
    recentEventIds: string[];
    projectLevels: Record<string, number>;
    lastProjectYear: number;
    chronicle: ChronicleEntry[];
    neighborRelations: Record<string, number>;
    activePartnerId: string | null;
    lastDiplomacyYear: number;
    treasury: number;
    lastFiscalBalance: number;
    lastBondYear: number;
    economicHistory: EconomicSnapshot[];
    factions?: Record<FactionId, FactionState>;
    characters?: Record<CharacterId, CharacterState>;
    agendaProposalIds?: string[];
    actionsRemaining?: number;
    scheduledConsequences?: ScheduledConsequence[];
    policyDecisions?: PolicyDecisionRecord[];
    promises?: PromiseRecord[];
    conceptProgress?: Partial<Record<ConceptId, ConceptProgress>>;
    advisorInsight?: number;
    chapter?: 'independence' | 'complete';
    /** Consequences that have landed, newest first. */
    newspaper?: NewspaperItem[];
    /** Forecasts awaiting an observable outcome. */
    forecastAudits?: ForecastAudit[];
    /** Decisions taken this turn, cleared when the turn advances. */
    turnDebrief?: TurnDebriefEntry[];
    /** Knowledge checks already answered, by id. */
    answeredChecks?: string[];
    /** Ending resolved at the close of the run. */
    endingId?: string;
    /** The territorial layer. */
    provinces?: Province[];
    /** Snapshot of provinces from the prior year, for year-over-year delta reporting. */
    previousProvinces?: Province[];
    /** Investment budget available to spend on provinces this year, $M. */
    provinceBudget?: number;
    /** Achievement ids already earned. */
    achievements?: string[];
}
