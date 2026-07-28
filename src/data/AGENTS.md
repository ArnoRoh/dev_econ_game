# Game content guidance

This directory contains authored, player-facing content. Keep mechanics in `src/engine/` and presentation in `src/components/`.

## Events

- Give every event a stable, unique snake_case `id`; changing an ID should be treated as a content migration.
- Every event needs a clear dilemma with at least two meaningfully different options. Avoid an option that dominates the others on every important stat.
- Effects are immediate numeric deltas and their keys must exist in `CountryStats`.
- Keep `theory` educational but concise, and make `source` identify the concept or author rather than imply a formal citation that was not checked.
- Use `minYear` and `maxYear` for genuinely time-bound events. Use `reqFlags` for narrative prerequisites and `setFlags` for persistent consequences.
- Tags should reuse the existing vocabulary where possible because matching artifact tags triples selection weight.
- Image paths are relative public paths such as `assets/finance.png`. Add the corresponding file under `public/assets/` and check exact filename casing.

## Artifacts

- Keep the point-buy budget in `src/App.tsx` in mind when setting `pointCost`.
- Negative-cost drawbacks should create a real disadvantage; positive-cost traits should not remove all meaningful risk.
- Tags should describe the situations the artifact makes more likely, not merely repeat its display name.

## Missions and development projects

- A mission should express a distinct play style through three measurable goals; avoid goals that all reward the same stat.
- Project effects apply at every level. Balance them as repeatable investments and keep their visible description aligned with every downside.
- Set `treasuryCost` against expected five-year fiscal revenue rather than encoding construction cost as a negative GDP effect.
- Treat `annualEffects` as compounding benefits across the remainder of a run; small growth-rate deltas can become dominant at high project levels.
- Keep project IDs stable because they are keys in `GameState.projectLevels`.

## Regional diplomacy

- Each diplomatic partner needs a distinct doctrine, an immediate pact tradeoff, and a restrained annual dividend.
- Pact benefits replace one another rather than stacking. Balance them for decade-long use and account for the automatic +20 partner / -5 rival relationship shift.
- Keep partner IDs stable because active pacts, bilateral relations, chronicles, and saves reference them.

## Review checklist

- Check IDs for uniqueness and flags for exact spelling.
- Confirm every effect key and sign matches the prose explanation.
- Check that time ranges can produce at least one eligible event in every playable year.
- Run `npm run check`, then smoke-test new content through the UI when practical.
