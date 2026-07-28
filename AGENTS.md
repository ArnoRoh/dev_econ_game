# Repository guidance

## Project shape

This is a small, client-only economic policy roguelite built with React 19, TypeScript, and Vite. It can run in a browser or inside the Electron shell in `electron/`.

- `src/App.tsx` owns the game flow, including setup, turns, event choices, game-over scoring, and leaderboard persistence.
- `src/saveGame.ts` owns the versioned local active-run save format. Bump the version or add migration logic when its stored shape becomes incompatible.
- `src/engine/` contains the simulation types and pure state transitions.
- `src/data/` contains authored starting conditions and policy events.
- `src/data/missions.ts` and `src/data/projects.ts` define long-run objectives and five-year development choices.
- `src/data/diplomacy.ts` defines neighboring states, pact terms, and annual treaty dividends shown on the regional map.
- `src/components/` contains presentational React components and their adjacent CSS.
- `public/assets/` contains event artwork addressed as `assets/<file>`.
- `electron/` contains the desktop entry point. Packaged output goes to ignored `release/`.

More specific `AGENTS.md` files under `src/engine/` and `src/data/` override this guidance for those areas.

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

`npm run check` runs ESLint and the production TypeScript/Vite build. There is not yet an automated test suite, so gameplay changes should also be smoke-tested in the browser with `npm run dev`.

The check also runs seeded balance simulations. Preserve the intentional gap between survival-aware and random play; update the accepted bands only with an explicit balance rationale.

For Electron development, start `npm run dev` first, then run `npm run electron:dev` in a second terminal. Use `npm run dist` only when validating the installer/package flow because it writes a full desktop build to `release/`.

## Change discipline

- When changing balance, explain the intended player-facing tradeoff in the change summary.
- Keep the five-year project cadence aligned between `buildProject` and the project-due check in `App.tsx`.
- Keep the diplomacy cadence aligned between `signDiplomaticPact` and the diplomacy-due check in `App.tsx`: 1965, then every ten years.
- Preserve unresolved `currentEvent` and `lastOutcome` when changing autosave behavior; reloading must not let a player skip a dilemma.
- When adding a stat, update the type, initial value, clamping rules if applicable, simulation behavior, dashboard display, and relevant content together.
- When adding an event image, verify the file exists in `public/assets/` with the exact case used by the event record.
- Keep changes focused. Avoid combining large content expansions, balance rewrites, and UI refactors in one change unless they are inseparable.
