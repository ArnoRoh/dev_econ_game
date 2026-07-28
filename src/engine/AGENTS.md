# Simulation engine guidance

This directory is the rules layer. Keep it independent of React, the DOM, local storage, and Electron.

## Invariants

- Functions that accept `GameState` must return a new state and must not mutate their inputs.
- `CountryStats` is the source of truth for valid effect keys. Event and artifact effects remain `Partial<CountryStats>` deltas.
- Clamp bounded 0-100 indicators in `clampStats`; do not clamp GDP, population, debt, or growth rates without an explicit design decision.
- Preserve the turn order in `App.tsx`: check the current state, advance the simulation, check again, then select an event. Choices apply their immediate effects and are checked for game over immediately.
- Timeline filters are inclusive: `minYear` is the first eligible year and `maxYear` is the last eligible year.
- Required flags are AND conditions. Artifact/event tag matches change event weight, not eligibility.
- Development projects may only be built in five-year planning years, once per planning year, up to their configured maximum level.
- Project `effects` apply on construction; `annualEffects` apply once per subsequent turn for every built level.
- GDP is productive capacity, while `treasury` is spendable state money. Project construction consumes treasury; annual taxes depend on GDP, stability, and education, while debt service reduces the fiscal balance.
- `economicHistory` contains annual snapshots, not post-decision snapshots, and is capped to the most recent twenty years.
- Mission bonuses award partial progress, so target changes affect scores throughout a run rather than only at completion.

## Balance changes

- Consider both immediate deltas and compounding effects. Small changes to growth, education, debt, and population can dominate long runs.
- Keep formulas named and commented by economic meaning rather than by a release/version number.
- If randomness becomes test-covered, inject or parameterize the random source instead of mocking `Math.random` globally.
- Check boundary values for every game-over threshold and clamped stat after modifying rules.
- Preserve the founding-mandate grace period through 1965 so every run can reach its first strategic milestone; collapse checks begin in 1966.
