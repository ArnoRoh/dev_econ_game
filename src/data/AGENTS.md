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

## Policy arcs

- An arc is an ordered list of `PolicyProposal` sharing one `arcId`, with `arcStep` starting at 1 and increasing by one. The engine will not surface a step before its predecessor resolves.
- Every option needs authored `forecasts` from at least two advisors who genuinely disagree. Do not derive a forecast from the numeric effects; some forecasts should be authored to turn out wrong.
- `rationale` and `immediateNarrative` carry the pre- and post-decision voice. Neither may quote a numeric effect.
- Teach conditionality. State the institutional preconditions under which the policy works, and never assert that a policy is simply good or bad.
- `createsPromise` records a public commitment. Its `completionFlag` must be a flag some later option in the same arc can actually set, or the promise is unkeepable by construction.
- Every proposal needs an `ignoreOutcome`. The cost of ignoring should be political — faction support and a grievance — rather than a direct stat penalty, because the player is forced to ignore something almost every year.
- `conceptIds` and `sourceIds` must exist in `concepts.ts` and `sources.ts`; the content validator enforces this.

## Concepts and the honesty rule

The educational layer teaches mechanisms. A mechanism presented without its
evidentiary status teaches false confidence, so `concepts.ts` carries three
fields that exist specifically to stop that:

- `contestation` — `well-supported`, `contested`, or `actively-disputed`.
  "Secure land tenure lengthens investment horizons" and "industrial policy
  caused the East Asian miracle" are not claims of the same kind, and a player
  who cannot tell them apart has learned something worse than nothing.
- `strongestObjection` — the best published argument against, with its author
  named. Never "critics say"; say who, and what their argument actually is.
- `whatWouldFalsifyIt` — what would have to be observed for the claim to fail.

`validate:content` requires all three on every concept in its disputed set, and
requires at least two `competingViews` and two `commonMisconceptions` on every
concept. Both lists render in the dossier, misconceptions marked as false so a
skimming player cannot mistake them for the lesson.

Where a real debate exists, cite both sides. Amsden, Wade and Chang argue the
state built the East Asian miracle; Krugman, Young, Pack and Saggi argue there
was less miracle to explain and weaker evidence that policy explains it. Lin and
Chang published a debate with each other. A concept citing only one side is
teaching a position rather than a subject.

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
