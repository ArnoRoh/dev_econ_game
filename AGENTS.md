# Repository guidance

## Project shape

This is a small, client-only economic policy roguelite built with React 19, TypeScript, and Vite. It can run in a browser or inside the Electron shell in `electron/`.

- `src/App.tsx` owns the game flow: setup, the cabinet turn loop, game-over scoring, and leaderboard persistence.
- `src/saveGame.ts` owns the versioned local active-run save format. Bump the version or add migration logic when its stored shape becomes incompatible.
- `src/engine/` contains the simulation types and pure state transitions.
- `src/data/` contains authored starting conditions and policy events.
- `src/data/missions.ts` and `src/data/projects.ts` define long-run objectives and five-year development choices.
- `src/data/diplomacy.ts` defines neighboring states, pact terms, and annual treaty dividends shown on the regional map.
- `src/data/arcs/` contains the authored multi-step policy arcs plus `legacyProposals.ts`, which adapts the annual-event corpus into cabinet proposals. The industrial-policy strand runs across `industrialStrategyArc.ts`, `exportLedArc.ts` and `developmentalStateArc.ts`; between them they carry the Lin-Chang debate, the miracle-accounting dispute, the fallacy of composition, and premature deindustrialization.
- `src/data/worldEras.ts` and `src/data/crises.ts` are the world outside the republic: authored decade conditions, and the six emergencies that suspend the agenda.
- `src/data/concepts.ts`, `sources.ts`, `characters.ts`, `factions.ts`, and `knowledgeChecks.ts` carry the educational layer.
- `src/components/` contains presentational React components and their adjacent CSS.
- `public/assets/` contains event artwork addressed as `assets/<file>`.
- `electron/` contains the desktop entry point. Packaged output goes to ignored `release/`.

More specific `AGENTS.md` files under `src/engine/` and `src/data/` override this guidance for those areas.

## The session loop

The campaign is **twenty-five cabinet sessions**, not seventy annual turns.
`GameState.turn` is the session index; `src/data/chapters.ts` owns the schedule
and asserts its own invariants at module load (twenty-five sittings, spans
summing to seventy years, 1960 to 2030).

An ordinary session runs: newspaper of landed consequences -> cabinet agenda of
three or four proposals with two action slots -> policy dossier -> decision ->
debrief -> optional knowledge check -> the simulated years.

A **crisis session** runs instead: newspaper -> crisis -> decision -> debrief.
The agenda is suspended entirely and the whole sitting goes to the crisis.

`src/engine/chapterLogic.ts` owns the per-year loop for both. It is the only
place that sequence lives — `App.tsx` and `scripts/simulate-agenda.mjs` both
call `runChapter`, so the balance simulation exercises the real code rather
than a reimplementation of it. Do not inline a year loop anywhere else.

Authored `delayTurns` and `deadlineTurns` throughout `src/data` are **years**;
the corpus predates multi-year sessions. They are converted at the point of use
with `yearsToChapters`, never rewritten in the data.

- Exact numeric effects must never appear before a decision. The dossier shows
  qualitative advisor forecasts; numbers are revealed in the debrief and archive.
- Forecasts are authored, never generated from the effects at runtime. They are
  audited against what actually happened, so some are authored to be wrong.
- Selecting a proposal is free; confirming an option is what spends an action.
- Anything left on the table when the session closes resolves through its
  `ignoreOutcome`, and the sponsoring faction records the slight.
- Arc steps outrank generic standing business in `generateAgenda`, and a later
  arc step cannot reach the table before its predecessor resolves.
- Standing business is `repeatable` and returns after `RECURRENCE_GAP_TURNS`.
  Without recurrence the agenda runs empty well before 2030.

## Working conventions

- Keep the simulation client-side and dependency-light unless a feature clearly requires another runtime service.
- Preserve the separation between authored content (`src/data`), deterministic state transitions (`src/engine`), and React rendering (`src/components` and `src/App.tsx`).
- Use `import type` for type-only imports. The TypeScript configuration enables strict checking and unused-symbol errors.
- Prefer immutable state updates. Do not mutate `GameState`, `CountryStats`, event definitions, or artifact definitions in place.
- Keep component CSS next to its component. Reuse the theme variables in `src/index.css` for shared colors and typography.
- Treat `dist/`, `release/`, and `node_modules/` as generated content; do not edit or commit them.
- Do not add secrets or environment-specific paths. The current game has no server-side configuration.

## Validation

Run the narrowest relevant check while working, then run the complete check before handing off:

```sh
npm run check
```

`npm run check` runs ESLint, the production TypeScript/Vite build, two seeded balance simulations, and two content validators. There is not yet an automated test suite, so gameplay changes should also be smoke-tested in the browser with `npm run dev`.

Two balance simulations run:

- `npm run balance` exercises the legacy one-event-per-year path.
- `npm run balance:agenda` exercises the cabinet loop the game actually plays,
  and fails the check if deliberate play cannot complete 2030, if careless play
  outlasts deliberate play, or if collapse becomes too forgiving.

Two content validators run:

- `npm run validate:content` checks `concepts.ts` and `sources.ts`.
- `npm run validate:arcs` checks the proposals themselves: unique ids, that every
  referenced concept, source, sponsor and faction exists, that arc steps form an
  unbroken sequence, that nothing depends on a flag no option sets, and that no
  promise is unkeepable by construction.

Preserve the intentional gap between deliberate and careless play; update the accepted bands only with an explicit balance rationale.

For Electron development, start `npm run dev` first, then run `npm run electron:dev` in a second terminal. Use `npm run dist` only when validating the installer/package flow because it writes a full desktop build to `release/`.

## Change discipline

- When changing balance, explain the intended player-facing tradeoff in the change summary.
- Cadences are **session-based**, never `year % n`. The sitting years are irregular
  and only four of the twenty-five are divisible by five, so a year test silently
  stops firing. `isDevelopmentPlanChapter` and `isSummitChapter` in
  `src/data/chapters.ts` are the single source for both; `buildProject`,
  `signDiplomaticPact` and the due-checks in `App.tsx` all read them.
- Development-plan sessions and crisis sessions are authored not to collide. If
  you move either, re-check that they stay disjoint — a milestone and a world
  emergency in one sitting will bury one of them.
- Preserve the unresolved agenda and turn phase when changing autosave behavior; reloading must not let a player skip a decision or re-take a spent action.
- Bump `SAVE_VERSION` in `src/saveGame.ts` whenever the stored shape changes.
- When adding a stat, update the type, initial value, clamping rules if applicable, simulation behavior, dashboard display, and relevant content together.
- When adding an event image, verify the file exists in `public/assets/` with the exact case used by the event record.
- Keep changes focused. Avoid combining large content expansions, balance rewrites, and UI refactors in one change unless they are inseparable.
