# Post-Colonial Republic

A single-player economic policy game about governing a newly independent country from 1960 to 2030. You choose a constitutional starting position and a national mission, then run the country one cabinet session at a time: a newspaper of consequences from earlier decisions, an agenda of competing proposals raised by named ministers, a policy dossier for whichever one you open, a decision, a debrief, and the simulated year.

The game runs as a browser app and can also be packaged as a Windows desktop application with Electron.

## Stack

- React 19 and TypeScript
- Vite for development and browser builds
- Electron and electron-builder for the desktop shell
- Browser `localStorage` for the active-run save and the local Hall of Fame

There is no backend, database, account system, or network API.

## Getting started

Requirements: a current Node.js release compatible with Vite 7, plus npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

## Scripts

```sh
npm run dev                # start the Vite dev server
npm run build              # TypeScript project build, then Vite build to dist/
npm run check               # lint, build, both balance simulations, and both content validators
npm run balance             # seeded smart-vs-random simulation of the legacy one-event-per-year path
npm run balance:agenda      # seeded simulation of the cabinet agenda loop the game actually plays
npm run validate:content    # checks concepts.ts and sources.ts for coverage and dangling references
npm run validate:arcs       # checks the authored arcs: unique ids, resolvable references, unbroken arc steps, keepable promises
npm run preview             # serve the production web build locally
npm run electron:dev        # open Electron against a running dev server
npm run dist                # build the web app and a desktop installer to release/
npm run deploy              # publish dist/ with gh-pages
```

`npm run check` is `lint && build && balance -- 250 && balance:agenda -- 60 && validate:content && validate:arcs`. There is no automated test suite, so gameplay changes should also be smoke-tested in the browser with `npm run dev`.

The two balance simulations cover different loops:

- `balance` plays the legacy one-event-per-year path against `src/data/events.ts`.
- `balance:agenda` plays the cabinet loop: an agenda of three or four proposals, two actions per turn, automatic resolution of whatever is left, and the delayed consequences those choices schedule. It fails if deliberate play cannot complete 2030, if careless play outlasts deliberate play, or if collapse becomes too forgiving.

For Electron development, use two terminals: run `npm run dev` in the first and `npm run electron:dev` in the second. Use `npm run dist` only when you need to validate the installer/package flow, since it writes a full desktop build to `release/`.

## How the game is organized

```text
src/
  App.tsx          game setup, the cabinet turn loop, game-over scoring, and persistence
  saveGame.ts      versioned local save format for the active run
  engine/          state types and pure state transitions
  data/
    arcs/          authored multi-step policy arcs, plus legacyProposals.ts adapting events.ts into standing-business proposals
    concepts.ts, sources.ts, characters.ts, factions.ts, knowledgeChecks.ts   the educational layer
    missions.ts, projects.ts, diplomacy.ts   national missions, five-year projects, and regional pacts
    events.ts, artifacts.ts   the legacy event corpus and constitutional starting traits
  components/      UI components and adjacent styles
public/assets/     event artwork
electron/          desktop process entry point
```

## How a turn works

A turn runs: newspaper → cabinet agenda → policy dossier → decision → debrief → optional knowledge check → the simulated year.

1. **Newspaper.** Consequences scheduled by earlier decisions land here, each headline naming the decision it traces back to.
2. **Cabinet agenda.** Three or four proposals are on the table, raised by one of four named ministers, but you only have two action slots this session. Opening a proposal is free; you can look at all of them.
3. **Policy dossier.** Opening a proposal shows the dispute, who benefits and who pays, the causal mechanism behind it (with the points where economists disagree), and the evidence it rests on — as an accordion you expand, not a wall of text. Each option lists qualitative advisor forecasts, not numbers. An Advisor Insight token, earned from a knowledge check, reveals a proposal's hidden assumptions and each advisor's real interest for the session.
4. **Decision.** Selecting an option and confirming it spends an action. Declining the whole proposal costs no action, but the sponsor remembers.
5. **Debrief.** The numbers you committed to are shown for the first time, along with what remains unsettled and what to watch for.
6. **Knowledge check.** Offered at most once per turn, only once you have met a concept twice, and never during a live decision. It costs nothing; a correct answer pays an Advisor Insight token.
7. **The simulated year.** Whatever is still on the table when you end the session resolves through its own outcome, and the sponsoring faction records the slight. The year advances, factions drift, and the next newspaper is prepared.

Arc proposals — the authored, multi-step storylines — outrank standing business for a seat at the table, and a later arc step cannot appear before its predecessor has resolved. Standing business is repeatable and returns a fixed number of turns after being resolved, so the agenda does not run dry before 2030.

## Systems

- **No exact numbers before a decision.** The dossier's advisor forecasts are authored by hand, not derived from the option's actual effects, and some are deliberately wrong. Each forecast is later scored against what happened, and the archive keeps a running "right N of M" record per advisor.
- **Delayed consequences.** Choices schedule effects that land years later and surface as newspaper headlines naming the original decision. A consequence can be gated on flags set — or not set — by what you did in between, so the same choice does not always resolve the same way.
- **Ignoring is a choice.** With three or four proposals and two actions, something is always left on the table. It is not held over — it resolves on its own via its authored outcome, and the sponsoring faction remembers.
- **Promises.** Some options commit the government publicly. A promise comes due on its own deadline and is judged against a completion flag: kept if the flag was set in time, broken if not, with the faction that was promised reacting either way.
- **Four factions and four characters.** Military, labour, business, and provincial factions each have support, power, and radicalisation; each is led by a named character with their own trust and memory of what you did to them.
- **Knowledge checks.** One per turn at most, offered only after a concept has been met twice, never mid-decision, never at a cost. A correct answer pays an Advisor Insight token.
- **Nine endings**, resolved from the political settlement you actually built — who ended up with support and power, not a single aggregate score — each citing your own promises and decisions back to you.
- **Content scale.** Three authored multi-step arcs (land reform, industrial strategy, resource boom) contribute 20 proposals; an adapted standing-business corpus contributes 40 more; 60 proposals and 172 options in total. Nine economics concepts carry 18 structured source citations between them.

## The wider game

Behind the turn loop, the rest of the original simulation is still there:

- The dashboard, the regional map, and the trend panel sit behind the "Statistics Office" toggle in the header.
- Five-year development projects and, from 1965 and then every ten years, regional diplomacy summits arrive as milestone modals between turns.
- A national mission chosen at setup defines bonus-score objectives, tracked in the mission panel.
- A local Hall of Fame records past runs by score, and the policy archive (opened from the header or from the game-over screen) lists every decision, newspaper item, promise, and forecast audit from the current run.

## Keyboard

- **Enter** or **Space** advances the phase you are in: continues past the newspaper, ends the cabinet session from the agenda, or moves on from the debrief.
- **Escape** backs out of an open policy dossier to the agenda, or closes the archive if it is open.
- **1–9** opens the matching proposal from the cabinet agenda, by position.

Keyboard input is ignored while typing in a text field.

## Design intent

This is a teaching game before it is a challenge game. The target is not a high score; it is a player who, afterwards, can explain the mechanism behind a policy dispute in their own words and recognise that the same policy — land redistribution, infant-industry protection, a resource windfall — can succeed in one institutional setting and fail in another. That is why numbers are withheld until the debrief, why forecasts are authored to sometimes be wrong, and why the dossier leads with who benefits and who pays rather than with what to click.

## Adding content

Authored arc steps live in `src/data/arcs/`; the adapted standing-business corpus is generated from `src/data/events.ts` by `src/data/arcs/legacyProposals.ts`. Constitutional starting conditions live in `src/data/artifacts.ts`. Effects are typed against `CountryStats` in `src/engine/types.ts`.

When adding an arc proposal:

1. Use a unique snake_case id for the proposal and for each option.
2. Give every option qualitative forecasts from real advisors, an `ignoreOutcome`, and effects that match what the forecasts describe.
3. Reference concepts and sources that already exist in `src/data/concepts.ts` and `src/data/sources.ts`, or add them there first.
4. Put any referenced image in `public/assets/` and use a path such as `assets/finance.png`, matching the file's exact case.
5. Run `npm run validate:arcs` and `npm run validate:content`, then smoke-test the proposal in the browser.

See `AGENTS.md` and the directory-level `AGENTS.md` files under `src/engine/` and `src/data/` for more detailed maintenance guidance.

## Current limitations

- There is no automated gameplay test suite; validation relies on lint, the build, two seeded balance simulations, and the content validators.
- The leaderboard and the active-run save are both local to one browser or Electron profile; there is no cloud synchronization.
- Some authored events do not yet have matching artwork; the UI omits unavailable images.
