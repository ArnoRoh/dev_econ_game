import type { CountryStats, FactionId, FactionState, GameState } from './types';

/**
 * Endings are read off the political settlement the player actually built, not
 * off a single score. Two runs can finish with the same GDP and land in very
 * different places depending on who ended up holding power.
 */

export interface EndingDefinition {
    id: string;
    name: string;
    tone: 'triumph' | 'qualified' | 'grim';
    summary: string;
    /** Longer verdict, shown with the citations from the player's own run. */
    verdict: string;
    /** Higher wins when several match. */
    priority: number;
    matches: (context: EndingContext) => boolean;
}

export interface EndingContext {
    stats: CountryStats;
    gdpPerCapita: number;
    factions: Record<FactionId, FactionState>;
    flags: Record<string, boolean>;
    collapsed: boolean;
    collapseReason?: string;
    keptPromises: number;
    brokenPromises: number;
    ignoredCount: number;
}

const support = (context: EndingContext, id: FactionId): number => context.factions[id]?.support ?? 50;
const power = (context: EndingContext, id: FactionId): number => context.factions[id]?.power ?? 50;
const radical = (context: EndingContext, id: FactionId): number => context.factions[id]?.radicalization ?? 0;

const meanSupport = (context: EndingContext): number => {
    const values = (['military', 'labor', 'business', 'provincial'] as FactionId[]).map(id =>
        support(context, id),
    );
    return values.reduce((sum, value) => sum + value, 0) / values.length;
};

export const ENDINGS: EndingDefinition[] = [
    {
        id: 'state_collapse',
        name: 'The State Came Apart',
        tone: 'grim',
        priority: 100,
        summary: 'The republic did not survive its own contradictions.',
        verdict:
            'The institutions inherited in 1960 were thin, and nothing was built to replace them before the pressure arrived. What follows is not a different government but the absence of one — and the historical record is clear that recovery from this point is measured in decades, not electoral cycles.',
        matches: context => context.collapsed,
    },
    {
        id: 'popular_revolt',
        name: 'The Streets Decided',
        tone: 'grim',
        priority: 90,
        summary: 'Organised labour and the provinces stopped waiting to be governed.',
        verdict:
            'Radicalisation is what happens when a group with real grievances concludes that the institutional route is closed to it. The mechanism is not mysterious: promises were made and not kept, and the cost of acting outside the system fell below the cost of staying inside it.',
        matches: context =>
            !context.collapsed &&
            (radical(context, 'labor') > 70 || radical(context, 'provincial') > 70) &&
            meanSupport(context) < 42,
    },
    {
        id: 'military_guardianship',
        name: 'The Republic in Uniform',
        tone: 'grim',
        priority: 80,
        summary: 'The army became the permanent arbiter of national politics.',
        verdict:
            'Once the officer corps becomes the body that settles political disputes, it does not readily stop. The pattern documented across the post-colonial record is self-reinforcing: each intervention lowers the threshold for the next, and the resulting governments tend to spend heavily on security and thinly on the human capital that produces long-run growth.',
        matches: context =>
            !context.collapsed && power(context, 'military') > 68 && support(context, 'military') > 60 &&
            context.stats.educationLevel < 55,
    },
    {
        id: 'elite_capture',
        name: 'A Republic of Owners',
        tone: 'grim',
        priority: 70,
        summary: 'Growth happened. It was captured before it reached most people.',
        verdict:
            'This is the outcome that dashboards conceal: aggregate output rises while the distribution of assets stays exactly where it was in 1960. Where land and credit remain concentrated, each new technology and each new investment is absorbed by those already holding the complements — which is why measured growth and mass poverty coexist so comfortably.',
        matches: context =>
            !context.collapsed &&
            support(context, 'business') > 66 &&
            support(context, 'provincial') < 40 &&
            context.stats.eliteSatisfaction > 60,
    },
    {
        id: 'rentier_state',
        name: 'The Terminal and the Palace',
        tone: 'grim',
        priority: 65,
        summary: 'The state learned to collect rents and forgot how to tax.',
        verdict:
            'A government funded by an export terminal need not bargain with its citizens, and so it never builds the machinery that bargaining requires. The exchange rate did the rest: with the currency held up by resource inflows, no other tradable sector could survive. The resource was real. The economy around it was not.',
        matches: context =>
            !context.collapsed &&
            Boolean(context.flags.resource_boom_spent || context.flags.resource_rents_distributed) &&
            !context.flags.sovereign_fund_established &&
            context.gdpPerCapita < 2200,
    },
    {
        id: 'developmental_coalition',
        name: 'The Developmental Coalition',
        tone: 'triumph',
        priority: 60,
        summary: 'A broad settlement held long enough for compounding to do its work.',
        verdict:
            'The rarest outcome in the historical record, and the least dramatic to live through. Nothing here happened quickly: schooling built over decades, an administration that could actually collect and deliver, and a distribution of assets wide enough that productivity gains reached the people who generated them. This is the East Asian pattern, and it required holding a political coalition together long past the point where it would have been easier to buy off one part of it.',
        matches: context =>
            !context.collapsed &&
            meanSupport(context) > 55 &&
            context.stats.educationLevel > 60 &&
            context.gdpPerCapita > 3200 &&
            context.stats.stability > 55,
    },
    {
        id: 'export_republic',
        name: 'The Export Republic',
        tone: 'triumph',
        priority: 55,
        summary: 'Discipline through world markets, at a cost paid on the factory floor.',
        verdict:
            'Subsidy tied to export performance produced firms that genuinely became competitive, because foreign buyers cannot be lobbied. The distributional record is more ambiguous than the growth record: the same wage restraint that made the strategy work was, for the workers concerned, simply wage restraint.',
        matches: context =>
            !context.collapsed &&
            Boolean(context.flags.export_discipline || context.flags.export_orientation_adopted) &&
            context.gdpPerCapita > 2600 &&
            support(context, 'business') > 52,
    },
    {
        id: 'human_development',
        name: 'The Long Investment',
        tone: 'triumph',
        priority: 52,
        summary: 'Not the richest republic on the continent. Among the healthiest and best schooled.',
        verdict:
            'Income per head is a poor proxy for how a life goes, and this run demonstrates the gap. Sustained investment in schooling, clinics and the position of women produced a population that lives longer and reads better than its GDP would predict — the Kerala and Sri Lanka pattern. The bet is that human capital eventually shows up in output; the evidence says it does, on a lag longer than any government survives.',
        matches: context =>
            !context.collapsed &&
            context.stats.educationLevel > 62 &&
            context.stats.genderEquality > 55 &&
            context.stats.famineRisk < 20,
    },
    {
        id: 'fragile_mandate',
        name: 'A Fragile Mandate',
        tone: 'qualified',
        priority: 30,
        summary: 'The republic survived, governing from one settlement to the next.',
        verdict:
            'No collapse and no transformation. The coalition held because none of its members found it worth breaking, rather than because any of them were satisfied. This is the most common outcome in the real record — and it is genuinely an achievement, since the counterfactual for most states in this position was very much worse.',
        matches: () => true,
    },
];

export function resolveEnding(context: EndingContext): EndingDefinition {
    return ENDINGS.filter(ending => ending.matches(context)).sort(
        (left, right) => right.priority - left.priority,
    )[0];
}

export function buildEndingContext(state: GameState): EndingContext {
    const promises = state.promises ?? [];
    const factions = state.factions ?? ({} as Record<FactionId, FactionState>);

    return {
        stats: state.country,
        gdpPerCapita: (state.country.gdp * 1_000_000) / (state.country.population * 1_000_000),
        factions,
        flags: state.flags,
        collapsed: state.gameOver && !/term limit/i.test(state.gameOverReason ?? ''),
        collapseReason: state.gameOverReason,
        keptPromises: promises.filter(promise => promise.status === 'kept').length,
        brokenPromises: promises.filter(promise => promise.status === 'broken').length,
        ignoredCount: (state.policyDecisions ?? []).filter(decision => decision.status === 'ignored').length,
    };
}

/**
 * Pull the specific moments an ending should cite. The plan is explicit that a
 * finale must reference the player's own promises and policies rather than
 * printing a generic verdict.
 */
export function endingCitations(state: GameState): string[] {
    const citations: string[] = [];
    const decisions = state.policyDecisions ?? [];
    const promises = state.promises ?? [];

    const broken = promises.filter(promise => promise.status === 'broken');
    if (broken.length) {
        citations.push(
            `You broke ${broken.length} commitment${broken.length > 1 ? 's' : ''}, beginning with "${broken[0].description}".`,
        );
    }

    const kept = promises.filter(promise => promise.status === 'kept');
    if (kept.length) {
        citations.push(`You kept your word on "${kept[0].description}".`);
    }

    const ignored = decisions.filter(decision => decision.status === 'ignored');
    if (ignored.length) {
        citations.push(
            `${ignored.length} proposal${ignored.length > 1 ? 's were' : ' was'} left unattended, including "${ignored[0].proposalTitle}".`,
        );
    }

    const chosen = decisions.filter(decision => decision.status === 'chosen');
    if (chosen.length) {
        const first = chosen[0];
        const last = chosen[chosen.length - 1];
        citations.push(`Your first act was "${first.optionText}" (${first.year}).`);
        if (last !== first) {
            citations.push(`Your last was "${last.optionText}" (${last.year}).`);
        }
    }

    return citations;
}
