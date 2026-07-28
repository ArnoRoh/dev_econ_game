# Educational Political Roguelite: Implementation Plan

## Purpose of this document

This is an execution specification for an implementation agent. It is intentionally narrower and more concrete than a general product roadmap.

The project already has a working React/TypeScript simulation, annual policy events, economic stats, projects, diplomacy, missions, autosave, a policy chronicle, charts, and balance simulations. The next version must make those systems emotionally engaging and genuinely educational.

The implementation agent must execute one work package at a time, preserve existing unrelated work, and run the stated checks after every package.

## Copy-paste instruction for an implementation agent

Use this prompt when handing off a work package:

> Read `AGENTS.md`, the nearest scoped `AGENTS.md` files, and `EDUCATIONAL_GAME_IMPLEMENTATION_PLAN.md` completely. Execute only work package WP-XX. Do not begin later packages. Preserve existing unrelated changes. Do not add dependencies unless the work package explicitly authorizes them. Run every acceptance check listed for WP-XX and report changed files, checks run, and any remaining risk.

---

## 1. Product decision

Build a **character-driven development-economics crisis roguelite**, not a larger dashboard simulator.

The target experience combines:

- the readable faction pressure and uncertainty of *Reigns*;
- the recurring characters, promises, and political consequences of *Suzerain*;
- the constrained agendas and run-to-run adaptation of *Against the Storm*;
- the incomplete information and permanent opportunity cost of *Pentiment*;
- the causal policy networks and stakeholder demands of *Democracy 4*.

Relevant primary/official references:

- [Reigns — Devolver Digital](https://www.devolverdigital.com/games/reigns)
- [Suzerain — Torpor Games](https://www.suzeraingame.com/)
- [Against the Storm — Eremite Games](https://eremitegames.com/ats-out-now/)
- [Pentiment — Obsidian Entertainment](https://pentiment.obsidian.net/)
- [Democracy 4 — Positech Games](https://www.positech.co.uk/democracy4/)
- [GDC: Making Player Choices Feel Like They Matter](https://www.gdcvault.com/play/1028017/Game-Narrative-Summit-Making-Player)

These are inspiration sources, not features to reproduce wholesale.

---

## 2. Non-negotiable goals

### 2.1 Player-experience goal

After a run, the player should describe events using people, promises, mechanisms, and consequences:

> “I promised land to tenant farmers, compromised with the landowners, and then the Green Revolution enriched the estates because I never fixed access to credit.”

They should not primarily describe the run as:

> “Education went up eight and stability fell ten.”

### 2.2 Learning goal

The game must help a player do all of the following:

1. Identify a development-economics concept in a concrete policy dispute.
2. Predict at least one causal mechanism before choosing.
3. Recognize that policies affect stakeholder groups differently.
4. Observe immediate and delayed consequences.
5. Compare the forecast with the actual outcome.
6. Explain why the same policy can succeed in one institutional context and fail in another.
7. Recall the policies they personally selected, rejected, ignored, promised, and later reversed.

### 2.3 Scope goal

Do not rewrite the entire 1960–2030 campaign first.

Implement and validate a **1960–1968 vertical slice** containing:

- eight turns;
- four recurring political factions;
- four recurring named political characters;
- three multi-step economic-policy arcs;
- two cabinet actions per turn from three or four proposals;
- promises, ignored proposals, and delayed consequences;
- a complete policy ledger;
- six knowledge checks;
- one chapter-ending election/coup/settlement;
- at least five distinct endings.

Only expand beyond 1968 after this slice is demonstrably engaging and educational.

---

## 3. What to preserve, demote, and replace

### Preserve

- React, TypeScript, Vite, and the client-only architecture.
- Existing immutable simulation functions.
- Country stats and treasury as the underlying model.
- Missions, artifacts, projects, diplomacy, autosave, and balance simulation.
- Existing event research as raw material.
- Existing artwork and visual direction.
- `npm run check` as the required final validation command.

### Demote in the main play flow

- The full dashboard.
- Historical charts.
- The regional-statistics panels.
- Long educational text before every decision.
- Exact numerical effect previews.

These remain accessible through secondary views such as “Statistics Office,” “Economic Brief,” and “Policy Archive.”

### Replace

- Replace one random annual event with a cabinet agenda containing multiple competing proposals.
- Replace exact green/red effect chips before a decision with qualitative forecasts from advisors.
- Replace isolated events with multi-step arcs and recurring characters.
- Replace the existing shallow chronicle with a complete decision-and-learning ledger.
- Replace immediate-only explanations with forecast-versus-outcome causal debriefs.

---

## 4. Target turn loop

Each normal turn must use this sequence:

1. **Newspaper:** show two or three consequences from earlier choices.
2. **Morning briefing:** show the national situation and urgent warnings in plain language.
3. **Cabinet agenda:** present three or four proposals from named characters.
4. **Action allocation:** player selects exactly two proposals to address.
5. **Policy dossier:** for each selected proposal, inspect stakeholders, relevant theory, competing forecasts, and sources.
6. **Decision:** select one policy option without exact numerical effects.
7. **Character reaction:** show immediate reactions, promises created or broken, and visible political movement.
8. **Ignored proposals:** resolve unattended proposals automatically and record who resents being ignored.
9. **End-turn simulation:** apply immediate effects, schedule delayed consequences, and advance active arcs.
10. **Cabinet debrief:** explain what changed, why it changed, what remains uncertain, and which later result should be watched.
11. **Ledger update:** record all selected, rejected, ignored, promised, and reversed policies.

Milestone turns may insert diplomacy or development planning, but must still end with a single debrief and ledger update.

---

## 5. Educational design

### 5.1 Layer information instead of dumping it

Every policy dossier must have progressive disclosure:

1. **Brief:** two or three sentences describing the dispute.
2. **Stakeholders:** who benefits, who pays, and who has political power.
3. **Economic mechanism:** a short causal chain in plain language.
4. **Competing view:** why a reasonable economist or political actor might disagree.
5. **Advisor forecasts:** qualitative predictions with confidence levels.
6. **Evidence and sources:** optional detailed reading.

Do not place a 300-word theory essay above the choice buttons.

### 5.2 Use a prediction–choice–outcome–reflection loop

For selected major proposals:

- Ask the player to predict the most likely mechanism or principal risk.
- Store the prediction without blocking progression.
- Let the player choose the policy.
- Reveal immediate effects narratively.
- Deliver delayed consequences one or more turns later.
- Compare the original forecast, player prediction, and actual outcome.

Knowledge checks should reward attention with an **Advisor Insight** token. They must not reduce country stats or end a run.

### 5.3 Teach conditionality

Avoid messages such as “land reform is good” or “trade protection is bad.”

Each explanation should identify relevant context, for example:

- state capacity;
- access to credit and extension services;
- market size;
- elite capture;
- exchange-rate regime;
- complementary infrastructure;
- distribution of assets;
- implementation timing;
- international conditions.

### 5.4 Separate positive and normative claims

Content must distinguish:

- **Positive claim:** what the model predicts will happen.
- **Normative judgment:** whether that outcome is desirable or fair.
- **Political constraint:** whether the policy can survive organized opposition.

### 5.5 Source policy

Replace unstructured strings such as `source: 'Amartya Sen / World Bank'` with structured citations.

Preferred source hierarchy:

1. Original academic paper or book.
2. World Bank, UNDP, IMF, WTO, ILO, FAO, or another relevant institution.
3. CORE Econ or another reputable educational source.
4. High-quality synthesis or historical case study.
5. Wikipedia only as an optional accessibility link, never the only source.

Every concept in the vertical slice needs at least two sources, including at least one original or institutional source.

---

## 6. Vertical-slice content

Use existing event material to construct these three arcs.

### Arc A: Land, incentives, and the Green Revolution

Concepts:

- land tenure and investment incentives;
- land reform;
- credit constraints;
- agricultural extension;
- Green Revolution technology;
- productivity versus distribution;
- elite capture.

Suggested steps:

1. Tenant farmers petition for title.
2. Landowners offer a compromise and political support.
3. Player chooses confiscation, compensated reform, tenancy regulation, or delay.
4. Agricultural technology package becomes available.
5. Access to credit and extension determines who adopts it.
6. Harvest outcome reveals distributional effects.

### Arc B: Industrial strategy and labor

Concepts:

- import substitution industrialization;
- export-oriented industrialization;
- infant-industry protection;
- learning by doing;
- comparative advantage;
- labor standards;
- movement into higher-value production.

Suggested steps:

1. Finance minister proposes tariff protection or export zones.
2. Manufacturers demand permanent protection.
3. Foreign investor requests labor concessions.
4. Union challenges wages and safety.
5. Export demand or foreign-exchange shortage tests the strategy.
6. Outcome evaluates productivity, wages, learning, and political coalition.

### Arc C: Resource boom and Dutch disease

Concepts:

- Dutch disease;
- real exchange-rate appreciation;
- rent seeking;
- sovereign wealth funds;
- fiscal rules;
- resource-backed borrowing;
- political distribution of rents.

Suggested steps:

1. Major mineral discovery.
2. Cabinet debates spending, saving abroad, or borrowing against future revenue.
3. Elite coalition demands contracts and patronage.
4. Currency appreciation harms agriculture and manufacturing.
5. Commodity-price shock tests the fiscal strategy.
6. Outcome reveals diversification, debt, and coalition consequences.

### Chapter finale

In 1968, resolve the vertical slice through an election, party congress, negotiated transition, coup attempt, or mass uprising.

At least five endings:

1. Developmental coalition.
2. Fragile electoral mandate.
3. Elite-captured republic.
4. Military guardianship.
5. Popular revolt or state collapse.

The ending must cite specific promises, factions, policies, and causal outcomes from the run.

---

## 7. Data contracts

Add the following types to `src/engine/types.ts`. Names may be adjusted only if all referenced work packages are updated consistently.

```ts
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
    support: number; // 0–100 relationship with the government
    power: number; // 0–100 capacity to affect outcomes
    radicalization: number; // 0–100 willingness to act outside institutions
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
```

Extend `GameState` with:

```ts
factions: Record<FactionId, FactionState>;
characters: Record<CharacterId, CharacterState>;
agendaProposalIds: string[];
actionsRemaining: number;
scheduledConsequences: ScheduledConsequence[];
policyDecisions: PolicyDecisionRecord[];
promises: PromiseRecord[];
conceptProgress: Partial<Record<ConceptId, ConceptProgress>>;
advisorInsight: number;
chapter: 'independence' | 'complete';
```

Do not delete the existing `chronicle` during the first migration. Keep it as a compatibility summary derived from `policyDecisions`, projects, and diplomacy.

---

## 8. File architecture

Add these data files:

```text
src/data/characters.ts
src/data/factions.ts
src/data/concepts.ts
src/data/sources.ts
src/data/knowledgeChecks.ts
src/data/arcs/landReformArc.ts
src/data/arcs/industrialStrategyArc.ts
src/data/arcs/resourceBoomArc.ts
src/data/arcs/index.ts
```

Add these engine files:

```text
src/engine/agendaLogic.ts
src/engine/factionLogic.ts
src/engine/consequenceLogic.ts
src/engine/learningLogic.ts
src/engine/endingLogic.ts
```

Add these components:

```text
src/components/GameShell.tsx
src/components/Newspaper.tsx
src/components/MorningBrief.tsx
src/components/CabinetAgenda.tsx
src/components/ProposalCard.tsx
src/components/PolicyDossier.tsx
src/components/CharacterCard.tsx
src/components/StakeholderPanel.tsx
src/components/ForecastPanel.tsx
src/components/CausalChain.tsx
src/components/TurnDebrief.tsx
src/components/PolicyLedger.tsx
src/components/PolicyLedgerEntry.tsx
src/components/PromiseLedger.tsx
src/components/KnowledgeCheckModal.tsx
src/components/ChapterReport.tsx
```

Each component may have one adjacent CSS file. Reuse existing theme variables.

Do not add a state-management library. Continue using React state plus pure engine functions until the vertical slice proves that another dependency is needed.

---

## 9. Engine behavior

### 9.1 Agenda generation

`generateAgenda` must:

- select three or four eligible proposals;
- prioritize active arc steps and due promises;
- include at most one generic fallback proposal;
- avoid proposals resolved in the prior two turns;
- guarantee at least one proposal related to the selected national mission;
- return stable results for an injected random function.

Signature:

```ts
generateAgenda(
    proposals: PolicyProposal[],
    state: GameState,
    random?: () => number,
): string[]
```

### 9.2 Action allocation

- Normal turns begin with two actions.
- Selecting a proposal consumes one action only when an option is confirmed.
- Inspecting a dossier is free.
- When no actions remain, all unresolved agenda proposals receive their `ignoreOutcome`.
- The ignored outcomes must be recorded in `policyDecisions` with `status: 'ignored'`.

### 9.3 Delayed consequences

`scheduleConsequences` adds due turns based on the current turn.

`resolveDueConsequences` must:

1. find every due consequence;
2. verify required and blocked flags;
3. apply country, treasury, faction, character, and flag changes immutably;
4. append a newspaper item;
5. update the source decision record;
6. remove the consequence from the pending queue.

All delayed consequences must be deterministic once scheduled.

### 9.4 Faction behavior

- Clamp support, power, and radicalization from 0–100.
- High power amplifies political consequences but not economic effects.
- Low support plus high power produces obstruction.
- Low support plus high radicalization produces strikes, capital flight, mutiny, or provincial resistance depending on faction.
- A faction must not become hostile from one ordinary decision unless it crosses an explicitly authored red line.

### 9.5 Forecast accuracy

Forecasts are authored, not generated from the actual numeric effects at runtime.

Advisor trust and loyalty determine presentation:

- high trust and loyalty: show authored confidence accurately;
- low competence or conflicting interest: reduce confidence or show a biased forecast;
- never fabricate exact statistics;
- always reveal the true authored mechanism in the post-decision debrief.

### 9.6 Knowledge checks

- Trigger one knowledge check after the player has seen a concept twice or when an arc resolves.
- Never interrupt the choice itself.
- Correct answer grants one Advisor Insight token.
- Incorrect answer immediately shows the explanation and does not reduce stats.
- Advisor Insight may reveal one extra assumption or improve one forecast confidence label.

---

## 10. UX requirements

### 10.1 Main screen hierarchy

The default play screen should show:

1. current year and country name;
2. two or three urgent warnings;
3. cabinet agenda;
4. recurring characters and faction standing;
5. map/project state in a compact secondary panel.

Move the current dashboard, trends, and detailed diplomacy panel behind secondary tabs or drawers.

### 10.2 Proposal card

Each proposal card shows:

- sponsor portrait/name/title;
- proposal title;
- two-sentence brief;
- affected stakeholder icons;
- urgency/deadline;
- active promise indicator;
- “Open dossier” button.

Do not show exact stat deltas.

### 10.3 Policy dossier

Tabs or sections:

- Brief
- Stakeholders
- Economic theory
- Advisor forecasts
- Evidence
- Decision

The decision section must remain reachable without reading every educational section, but the mechanism summary must be visible before confirmation.

### 10.4 Debrief

After a decision, show:

- chosen policy;
- immediate narrative;
- character/faction reactions;
- causal-chain diagram;
- observed immediate effects;
- delayed result to watch;
- concept names;
- source links;
- player’s prior prediction, when available.

### 10.5 Policy ledger

The ledger must support filters:

- all;
- chosen;
- ignored;
- broken promises;
- by concept;
- by faction;
- unresolved consequences.

Each entry expands to show:

- proposal and year;
- sponsor;
- selected or ignored option;
- original forecast;
- player prediction;
- immediate effects;
- every resolved delayed consequence;
- promises created, kept, or broken;
- concepts and citations.

This is the primary answer to “what policies did I choose and what did they do?”

### 10.6 Accessibility

- All clickable cards must be real buttons or links.
- Dossier tabs must be keyboard accessible.
- Do not rely on color alone for positive/negative effects.
- Respect reduced-motion preferences.
- Maintain readable text at 200% zoom.
- Provide text alternatives for portraits and diagrams.

---

## 11. Work packages

### WP-00 — Baseline and guardrails

Goal: establish a safe implementation baseline.

Tasks:

1. Read all `AGENTS.md` files.
2. Run `git status --short` and preserve unrelated work.
3. Run `npm run check` and save the output in the handoff report, not in the repository.
4. Confirm the current active-save version in `src/saveGame.ts`.
5. Do not modify gameplay in this package.

Acceptance:

- Existing check passes.
- No files changed.

### WP-01 — Educational and narrative types

Goal: add the contracts in section 7 without changing runtime behavior.

Files:

- `src/engine/types.ts`

Tasks:

1. Add all new IDs and interfaces.
2. Extend `GameState` with optional transitional fields first if required to keep the build passing.
3. Do not modify `events.ts`.

Acceptance:

- `npm run lint`
- `npm run build`
- No visual or gameplay change.

### WP-02 — Sources and economic concepts

Goal: create structured educational content for only the nine listed concepts.

Files:

- `src/data/sources.ts`
- `src/data/concepts.ts`
- `scripts/validate-educational-content.mjs`
- `package.json`

Tasks:

1. Author the nine concepts from section 6.
2. Give each concept mechanism steps, assumptions, misconceptions, competing views, indicators, and at least two source IDs.
3. Add structured source entries.
4. Add a validator checking unique IDs, valid source references, non-empty mechanisms, and two-source minimum.
5. Add `npm run validate:content`.
6. Append `npm run validate:content` to `npm run check`.

Acceptance:

- Validator fails on a deliberately broken reference during development.
- Restore valid content before handoff.
- `npm run check` passes.

### WP-03 — Factions and characters

Goal: add four recurring political actors and initialize their state.

Files:

- `src/data/factions.ts`
- `src/data/characters.ts`
- `src/engine/factionLogic.ts`
- `src/engine/gameLogic.ts`
- `src/engine/types.ts`

Tasks:

1. Define four factions and four leaders.
2. Use stable IDs from section 7.
3. Initialize faction and character state in `createInitialState`.
4. Add immutable `applyFactionEffects` and `applyCharacterMemory` helpers.
5. Clamp faction values.

Acceptance:

- Deterministic script proves faction effects do not mutate prior state.
- Boundary values clamp to 0 and 100.
- `npm run check` passes.

### WP-04 — Arc data for land reform only

Goal: implement one complete arc before creating a generic arc engine for all content.

Files:

- `src/data/arcs/landReformArc.ts`
- `src/data/arcs/index.ts`

Tasks:

1. Author six land-reform steps.
2. Provide ignore outcomes for every proposal.
3. Include forecasts from at least two characters per major proposal.
4. Include delayed consequences.
5. Link every option to concepts and sources.
6. Avoid exact effect values in player-facing forecast strings.

Acceptance:

- All IDs unique.
- Every proposal has two or more options.
- Every proposal has an ignore outcome.
- Content validator passes.

### WP-05 — Agenda and action-slot engine

Goal: replace the single-event selection path for the vertical slice.

Files:

- `src/engine/agendaLogic.ts`
- `src/engine/gameLogic.ts`
- `src/App.tsx`
- `scripts/simulate-agenda.mjs`

Tasks:

1. Implement `generateAgenda` with injected randomness.
2. Initialize two actions per turn.
3. Add select, confirm, reject, and ignore transitions.
4. Preserve the old `EVENTS` route behind a feature flag named `legacyAnnualEvents` during migration.
5. Use the new agenda only for 1960–1968.

Acceptance:

- Same seed produces same agenda.
- Agenda has three or four eligible proposals.
- Player can confirm at most two.
- Remaining proposals resolve as ignored.
- `npm run check` passes.

### WP-06 — Cabinet agenda UI

Goal: make the new loop playable with minimal educational UI.

Files:

- `src/components/GameShell.tsx`
- `src/components/MorningBrief.tsx`
- `src/components/CabinetAgenda.tsx`
- `src/components/ProposalCard.tsx`
- adjacent CSS files
- `src/App.tsx`

Tasks:

1. Render agenda cards and remaining actions.
2. Show sponsor, stakeholders, urgency, and promise indicator.
3. Use buttons, not clickable divs.
4. Move existing dashboard panels into a secondary details region.
5. Do not yet add full dossiers.

Acceptance:

- Keyboard-only player can select and inspect proposals.
- Mobile viewport has no horizontal scrolling.
- No exact numeric effect preview.
- `npm run check` passes.

### WP-07 — Policy dossier and layered learning

Goal: present useful policy information without overwhelming the choice.

Files:

- `src/components/PolicyDossier.tsx`
- `src/components/CharacterCard.tsx`
- `src/components/StakeholderPanel.tsx`
- `src/components/ForecastPanel.tsx`
- adjacent CSS files
- `src/App.tsx`

Tasks:

1. Implement the six dossier sections from section 10.3.
2. Resolve concept and source IDs through data maps.
3. Show qualitative forecasts and confidence.
4. Add an optional player-prediction question to major proposals.
5. Do not show actual effects until after confirmation.

Acceptance:

- Decision can be completed without opening optional evidence details.
- Theory summary and mechanism are visible before confirmation.
- Source links use `rel="noopener noreferrer"`.
- Keyboard and 200% zoom checks pass.

### WP-08 — Decision ledger foundation

Goal: record every meaningful policy action.

Files:

- `src/engine/agendaLogic.ts`
- `src/engine/types.ts`
- `src/components/PolicyLedger.tsx`
- `src/components/PolicyLedgerEntry.tsx`
- adjacent CSS files

Tasks:

1. Append `PolicyDecisionRecord` for chosen, rejected, ignored, and reversed decisions.
2. Store forecast, prediction, concept IDs, source IDs, effects, and scheduled consequence IDs.
3. Implement filters from section 10.5.
4. Keep old chronicle entries derived from new records.

Acceptance:

- All agenda proposals appear in the ledger after turn resolution.
- Ignored proposal is distinguishable from rejected proposal.
- Expanding an entry shows exact actual effects.
- Reload preserves filters only if easy; preserving records is mandatory.

### WP-09 — Delayed consequence engine and newspaper

Goal: make decisions persist and return later.

Files:

- `src/engine/consequenceLogic.ts`
- `src/components/Newspaper.tsx`
- `src/components/TurnDebrief.tsx`
- `src/components/CausalChain.tsx`
- adjacent CSS files
- `src/App.tsx`

Tasks:

1. Implement schedule and resolution behavior from section 9.3.
2. Resolve consequences before agenda generation.
3. Show resolved consequences as newspaper stories.
4. Update the originating ledger record.
5. Show forecast-versus-outcome causal chains.

Acceptance:

- Delayed result fires on exactly the scheduled turn.
- Reload before due turn does not duplicate or skip it.
- Required and blocked flags work.
- Originating ledger record lists the resolved consequence.

### WP-10 — Promises

Goal: turn political support into remembered commitments.

Files:

- `src/engine/factionLogic.ts`
- `src/components/PromiseLedger.tsx`
- `src/components/CabinetAgenda.tsx`
- vertical-slice arc data

Tasks:

1. Allow selected options to create promises.
2. Evaluate promises at deadlines.
3. Apply kept/broken faction reactions.
4. Surface due promises in the agenda.
5. Record promises in policy ledger and chapter ending.

Acceptance:

- Promise survives save/reload.
- Kept promise resolves once.
- Broken promise creates a grievance and ledger entry.
- Promise cannot be both kept and broken.

### WP-11 — Remaining two arcs

Goal: author industrial strategy and resource boom using the proven land-reform format.

Files:

- `src/data/arcs/industrialStrategyArc.ts`
- `src/data/arcs/resourceBoomArc.ts`
- `src/data/arcs/index.ts`

Tasks:

1. Author six steps per arc.
2. Reuse existing researched event text carefully; rewrite it into concise dossier layers.
3. Include cross-arc interactions, for example resource appreciation weakening the chosen industrial strategy.
4. Do not add a fourth arc.

Acceptance:

- Each arc has at least three materially different endings.
- At least four delayed consequences depend on earlier flags.
- All content validation passes.

### WP-12 — Knowledge checks and learning progress

Goal: add retrieval and reflection without school-like punishment.

Files:

- `src/data/knowledgeChecks.ts`
- `src/engine/learningLogic.ts`
- `src/components/KnowledgeCheckModal.tsx`
- adjacent CSS

Tasks:

1. Author six checks, at least one per major concept cluster.
2. Track exposure and correct responses.
3. Grant Advisor Insight on correct answers.
4. Allow Insight to reveal an assumption or improve one forecast.
5. Show explanations for every answer.

Acceptance:

- Check never changes country stats.
- Same check does not repeat in one chapter.
- Incorrect response still shows the correct mechanism.
- Learning progress saves and reloads.

### WP-13 — Chapter ending and educational report

Goal: complete the 1960–1968 slice.

Files:

- `src/engine/endingLogic.ts`
- `src/components/ChapterReport.tsx`
- adjacent CSS
- `src/App.tsx`

Tasks:

1. Determine one of five endings using faction state, promises, flags, country stats, and decisions.
2. Produce a personalized narrative referencing at least three actual decisions.
3. Show concepts encountered and policy outcomes.
4. Show unresolved questions rather than claiming one correct development path.
5. Offer restart and policy-ledger review.

Acceptance:

- Five fixture states produce five distinct endings.
- Ending references valid decision IDs.
- Chapter report remains readable on mobile.

### WP-14 — Save migration

Goal: save and resume the new vertical slice safely.

Files:

- `src/saveGame.ts`
- save-related tests or validation script

Tasks:

1. Increment save version from the current version to the next integer.
2. Add a migration only if it can be reliable; otherwise invalidate older active runs cleanly.
3. Preserve unresolved agenda, open decisions, predictions, consequences, promises, ledger, faction state, and learning progress.
4. Test reload at every turn phase.

Acceptance:

- Reload during dossier restores the unresolved proposal.
- Reload after first action preserves one remaining action.
- Reload before a delayed consequence does not duplicate it.
- Invalid older save returns to menu without crashing.

### WP-15 — Simulation and regression checks

Goal: validate engagement-related systems mechanically.

Files:

- `scripts/simulate-balance.mjs`
- `scripts/simulate-agenda.mjs`
- `scripts/validate-educational-content.mjs`
- `package.json`

Tasks:

1. Extend balance simulation for faction support, promises, action slots, and consequences.
2. Add deterministic agenda simulations.
3. Validate content references.
4. Do not optimize for a specific completion percentage until playtesting.

Mechanical acceptance bands:

- 100% of valid simulated runs receive a legal agenda.
- No run confirms more than two normal proposals per turn.
- Every scheduled consequence resolves at most once.
- Every policy decision appears in the ledger.
- No source or concept reference is missing.
- `npm run check` passes.

---

## 12. Content-quality checklist

Every authored proposal must satisfy all items:

- The dispute is understandable without prior economics education.
- At least two stakeholders want different outcomes.
- No option dominates all other options in every context.
- The mechanism is described causally, not as a slogan.
- Assumptions are explicit.
- A competing interpretation is represented fairly.
- Immediate and delayed effects are both present when appropriate.
- The option can interact with at least one earlier choice.
- The ignore outcome is meaningful.
- At least one source is original or institutional.
- Exact numerical effects are absent from pre-decision player text.
- Actual effects are visible in the debrief and ledger.
- Normative and positive claims are distinguishable.

---

## 13. Definition of done for the vertical slice

The redesign is ready for broader content only when all of the following are true:

### Functional

- Eight-turn 1960–1968 chapter is playable from start to ending.
- Each turn offers three or four proposals and two actions.
- Three arcs can progress and interact.
- Four factions and characters react and remember.
- Promises, ignored issues, and delayed consequences work after reload.
- Policy ledger contains a complete history.
- Six knowledge checks work.
- Five endings work.

### Educational

- Every major proposal links to an economic concept and structured sources.
- Player predicts mechanisms before at least three major choices.
- Debrief compares forecast with observed outcome.
- Chapter report summarizes concepts and context, not just scores.
- A player can review exactly what they chose and what happened later.

### UX

- Main flow centers on people and active decisions.
- Detailed dashboard is secondary.
- No exact stat deltas are shown before ordinary policy choices.
- Keyboard navigation works.
- Mobile has no horizontal overflow.
- Color is not the sole carrier of meaning.

### Validation

- `npm run check` passes.
- Educational content validator passes.
- Agenda and consequence simulations pass.
- Browser console has no warnings or errors.
- Save/reload phase matrix passes.

### Playtest

Conduct at least five external playtests.

Ask each tester:

1. What happened in your republic?
2. Which character or faction did you trust most?
3. Which promise did you regret?
4. Explain one economic mechanism you encountered.
5. What would you do differently in another run?

Success criteria:

- At least four testers describe the run using characters or promises.
- At least four correctly explain one mechanism without reopening the theory text.
- At least three immediately want to try a different path.
- No tester describes the game primarily as “keeping bars high.”

---

## 14. Explicit non-goals

Do not implement these before vertical-slice playtesting:

- a full 1960–2030 rewrite;
- dozens of new one-off events;
- real-time combat;
- a detailed province economy;
- procedural AI-written policy content;
- multiplayer;
- cloud saves;
- voice acting;
- a new framework or state library;
- complex animations;
- monetization;
- permanent stat advantages from meta-progression.

---

## 15. Recommended execution order

Execute in this order and stop for review at each marked gate:

1. WP-00
2. WP-01
3. WP-02
4. WP-03
5. WP-04
6. WP-05
7. WP-06
8. **Gate A: play the agenda loop without full educational UI.**
9. WP-07
10. WP-08
11. WP-09
12. WP-10
13. **Gate B: play the complete land-reform arc twice.**
14. WP-11
15. WP-12
16. WP-13
17. WP-14
18. WP-15
19. **Gate C: five-user vertical-slice playtest.**

Do not proceed beyond a gate merely because the build passes. The gate question is whether the loop is understandable, emotionally legible, and worth replaying.

---

## 16. Final instruction to the implementation agent

The goal is not to maximize the number of mechanics or the quantity of economics text.

The goal is to make the player:

- care who is asking;
- understand the policy mechanism;
- make a prediction under uncertainty;
- sacrifice one opportunity to pursue another;
- see consequences return later;
- remember promises and reversals;
- compare their beliefs with what happened;
- leave able to explain development economics more clearly.

When a proposed implementation does not strengthen at least one of those outcomes, do not add it.
