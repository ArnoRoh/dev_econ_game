# Post-Colonial Republic

A single-player economic policy roguelite about governing a newly independent country from 1960 to 2030. Choose a constitutional starting position, respond to annual policy dilemmas, and balance growth, political stability, elite support, debt, education, food security, and international relations.

The game runs as a browser app and can also be packaged as a Windows desktop application with Electron.

## Stack

- React 19 and TypeScript
- Vite for development and browser builds
- Electron and electron-builder for the desktop shell
- Browser `localStorage` for the local Hall of Fame

There is no backend, database, account system, or network API.

## Getting started

Requirements: a current Node.js release compatible with Vite 7, plus npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

Useful commands:

```sh
npm run check         # lint and create a production web build
npm run balance       # run seeded smart-vs-random balance simulations
npm run build         # TypeScript check and Vite build to dist/
npm run preview       # serve the production web build locally
npm run electron:dev  # open Electron; run npm run dev first
npm run dist          # build the web app and desktop installer to release/
npm run deploy        # publish dist/ with gh-pages
```

For Electron development, use two terminals: run `npm run dev` in the first and `npm run electron:dev` in the second.

## How the game is organized

```text
src/
  App.tsx          game setup, turn flow, scoring, and persistence
  engine/          state types and simulation rules
  data/            events, artifacts, missions, projects, and diplomacy
  components/      UI components and adjacent styles
public/assets/     event artwork
electron/          desktop process entry point
```

Each run now has three connected layers:

- Choose constitutional traits and a national mission that defines bonus-score objectives.
- Advance through annual policy dilemmas; recently seen events leave the selection pool so runs do not repeat the same few choices.
- Every five years, fund one level of a national development project. Transport, universities, irrigation, industry, diplomacy, and defence visibly reshape the country view and change its underlying stats.
- Taxes convert GDP and institutional capacity into treasury revenue. Projects spend treasury rather than GDP; development bonds can fund a shortfall but create more debt service.
- Built projects keep producing annual dividends, while cabinet warnings expose approaching coup, invasion, famine, recession, and debt thresholds.
- Active runs autosave locally, including unresolved events, and every policy or development choice is recorded in the national chronicle.
- The statistics office charts the last twenty years of GDP, debt, stability, education, and famine risk.
- Regional summits begin in 1965 and recur every decade, allowing the republic to align with one neighboring state for immediate pact terms and continuing treaty dividends.

Policy choices apply immediate stat changes and may set flags that unlock later events. A run ends in 2030 or when a coup, invasion, or famine condition is reached.

The transitional government has a founding mandate through 1965, ensuring every run reaches its first summit and development plan. Political and economic risks still accumulate during those years; collapse conditions begin applying in 1966.

## Adding content

Events live in `src/data/events.ts`; constitutional starting conditions live in `src/data/artifacts.ts`. Their effects are typed against `CountryStats` in `src/engine/types.ts`.

When adding an event:

1. Use a unique snake_case ID.
2. Provide at least two meaningful options with effects that match their explanations.
3. Reuse existing tags when possible so artifact weighting stays coherent.
4. Put any referenced image in `public/assets/` and use a path such as `assets/finance.png`.
5. Run `npm run check` and smoke-test the event in the browser.

See the repository and directory-level `AGENTS.md` files for more detailed maintenance guidance.

## Current limitations

- There is no automated gameplay test suite yet.
- The leaderboard is local to one browser/Electron profile.
- Active saves are also local to one browser/Electron profile; there is no cloud synchronization.
- Some authored events do not yet have matching artwork; the UI omits unavailable images.
