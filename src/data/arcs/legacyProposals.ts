import { EVENTS } from '../events.ts';
import type {
    CharacterId,
    ConceptId,
    DelayedConsequenceSpec,
    EducationalPolicyOption,
    FactionEffect,
    FactionId,
    GameEvent,
    PolicyProposal,
    QualitativeForecast,
} from '../../engine/types';

/**
 * Adapter: brings the original annual-event corpus into the cabinet frame.
 *
 * The authored writing — description, theory, per-option explanations, sources —
 * is carried across verbatim. What is *derived* is limited to routing (which
 * minister raises it) and a conservative reading of direction for the advisor
 * line, so that no statistic is invented that an author did not write.
 *
 * These are marked generic: an authored arc step always outranks them when the
 * agenda is assembled.
 */

const TAG_SPONSOR: [string, CharacterId][] = [
    ['labor', 'labor_leader'],
    ['unrest', 'labor_leader'],
    ['urban', 'labor_leader'],
    ['military', 'army_chief'],
    ['war', 'army_chief'],
    ['geopolitics', 'army_chief'],
    ['crime', 'army_chief'],
    ['agriculture', 'provincial_chair'],
    ['rural', 'provincial_chair'],
    ['food', 'provincial_chair'],
    ['poverty', 'provincial_chair'],
    ['health', 'provincial_chair'],
    ['education', 'provincial_chair'],
    ['gender', 'provincial_chair'],
    ['social', 'provincial_chair'],
    ['environment', 'provincial_chair'],
];

const sponsorFor = (event: GameEvent): CharacterId => {
    const tags = event.tags ?? [];
    for (const [tag, sponsor] of TAG_SPONSOR) {
        if (tags.includes(tag)) return sponsor;
    }
    // Trade, finance, debt, industry and institutions all sit with the Treasury.
    return 'finance_minister';
};

const FACTION_OF: Record<CharacterId, FactionId> = {
    finance_minister: 'business',
    army_chief: 'military',
    labor_leader: 'labor',
    provincial_chair: 'provincial',
};

const TAG_CONCEPT: [string, ConceptId][] = [
    ['resource_curse', 'resource_curse'],
    ['mining', 'resource_curse'],
    ['fdi', 'export_orientation'],
    ['labor', 'labor_standards'],
    ['agriculture', 'green_revolution'],
    ['food', 'green_revolution'],
    ['inequality', 'land_tenure'],
    ['rural', 'land_tenure'],
    ['statist', 'import_substitution'],
    ['industry', 'import_substitution'],
    ['trade', 'export_orientation'],
];

const conceptsFor = (event: GameEvent): ConceptId[] => {
    const tags = event.tags ?? [];
    const found = new Set<ConceptId>();

    // A handful of events map exactly onto a slice concept; prefer those.
    if (event.id === 'dutch_disease') found.add('dutch_disease');
    if (event.id === 'isi_policy') {
        found.add('import_substitution');
        found.add('infant_industry');
    }
    if (event.id === 'sez_labor' || event.id === 'general_strike_sweatshops') found.add('labor_standards');
    if (event.id === 'green_revolution') found.add('green_revolution');
    if (event.id === 'land_reform') found.add('land_tenure');

    if (found.size === 0) {
        for (const [tag, concept] of TAG_CONCEPT) {
            if (tags.includes(tag)) {
                found.add(concept);
                break;
            }
        }
    }

    return [...found];
};

/** Stats where a rise is bad for the country. */
const INVERTED = new Set(['famineRisk', 'externalDebt']);

/**
 * Read a direction from the option's own authored effects. This is a summary of
 * what the author already wrote, not a new prediction — and it is deliberately
 * coarse, resolving to "cuts both ways" whenever the effects genuinely conflict.
 */
const directionOf = (effects: Record<string, number | undefined>): QualitativeForecast['predictedDirection'] => {
    let score = 0;
    for (const [key, value] of Object.entries(effects)) {
        if (typeof value !== 'number' || value === 0) continue;
        const good = INVERTED.has(key) ? -Math.sign(value) : Math.sign(value);
        // Growth and stability carry more weight in how a cabinet would read it.
        score += good * (key === 'gdpGrowthRate' || key === 'stability' ? 2 : 1);
    }
    if (score >= 4) return 'stronglyUp';
    if (score > 0) return 'up';
    if (score <= -4) return 'stronglyDown';
    if (score < 0) return 'down';
    return 'mixed';
};

const stakeholdersFor = (event: GameEvent): string => {
    const tags = event.tags ?? [];
    const parts: string[] = [];
    if (tags.some(tag => ['labor', 'unrest', 'urban'].includes(tag))) {
        parts.push('organised urban labour has the most immediately at stake');
    }
    if (tags.some(tag => ['agriculture', 'rural', 'food', 'poverty'].includes(tag))) {
        parts.push('smallholders and the rural districts carry the consequences furthest from the capital');
    }
    if (tags.some(tag => ['finance', 'debt', 'trade', 'industry', 'fdi'].includes(tag))) {
        parts.push('creditors and industrialists are watching how predictable the state proves');
    }
    if (tags.some(tag => ['military', 'war', 'geopolitics'].includes(tag))) {
        parts.push('the officer corps treats this as a question of national security');
    }
    if (parts.length === 0) {
        parts.push('the costs and benefits fall unevenly across the republic');
    }
    return `${parts.join('; ')}.`;
};

/**
 * What happens if the cabinet never gets to it.
 *
 * The real cost of ignoring a matter is political, not statistical: the
 * opportunity is gone for good and the person who raised it remembers. Applying
 * a stat penalty on top compounded far too fast, because with three or four
 * proposals and two actions the player is always ignoring something.
 */
const ignoreOutcomeFor = (event: GameEvent): DelayedConsequenceSpec => ({
    id: `${event.id}_unattended`,
    delayTurns: 1,
    headline: `${event.title}: Settled Without the Cabinet`,
    narrative:
        'With no direction from the government, officials, interested parties and events decided the matter between them. The outcome satisfied nobody in particular and cost the administration some of its authority.',
    effects: {},
    conceptIds: conceptsFor(event),
    factionEffects: [
        {
            factionId: FACTION_OF[sponsorFor(event)],
            support: -3,
            radicalization: 1,
            grievance: `Ignored: ${event.title}`,
        },
    ],
});

const toOption = (
    event: GameEvent,
    option: GameEvent['options'][number],
    index: number,
    sponsor: CharacterId,
): EducationalPolicyOption => {
    const concepts = conceptsFor(event);
    const factionEffects: FactionEffect[] = [];

    // The original corpus expressed elite reaction through eliteSatisfaction.
    const elite = option.effects.eliteSatisfaction ?? 0;
    if (elite) factionEffects.push({ factionId: 'business', support: Math.round(elite * 0.6) });
    const stability = option.effects.stability ?? 0;
    if (stability) factionEffects.push({ factionId: 'labor', support: Math.round(stability * 0.4) });
    const military = option.effects.militaryPower ?? 0;
    if (military) factionEffects.push({ factionId: 'military', support: Math.round(military * 0.6) });
    const famine = option.effects.famineRisk ?? 0;
    if (famine) factionEffects.push({ factionId: 'provincial', support: Math.round(-famine * 0.5) });

    return {
        id: `${event.id}_opt${index}`,
        text: option.text.trim(),
        rationale: option.explanation ?? 'The cabinet is divided on what this would actually achieve.',
        immediateNarrative: option.explanation ?? 'The measure is enacted.',
        effects: option.effects,
        factionEffects,
        forecasts: [
            {
                advisorId: sponsor,
                summary: option.explanation ?? 'The likely effect is disputed within the cabinet.',
                predictedDirection: directionOf(option.effects as Record<string, number | undefined>),
                confidence: 'medium',
            },
        ],
        conceptIds: concepts,
        sourceIds: [],
        delayedConsequences: [],
        setFlags: option.setFlags,
    };
};

const toProposal = (event: GameEvent): PolicyProposal => {
    const sponsor = sponsorFor(event);

    return {
        id: `legacy_${event.id}`,
        arcId: 'standing_business',
        arcStep: 1,
        title: event.title,
        sponsorId: sponsor,
        brief: event.description,
        stakeholderSummary: stakeholdersFor(event),
        conceptIds: conceptsFor(event),
        sourceIds: [],
        options: event.options.map((option, index) => toOption(event, option, index, sponsor)),
        ignoreOutcome: ignoreOutcomeFor(event),
        minYear: event.minYear,
        maxYear: event.maxYear,
        requiredFlags: event.reqFlags,
        isGeneric: true,
        // Structural disputes recur; the agenda engine enforces a long gap.
        repeatable: true,
        backgroundTheory: event.theory,
        wikiLink: event.wikiLink,
        legacySource: event.source,
    };
};

export const LEGACY_PROPOSALS: PolicyProposal[] = EVENTS.map(toProposal);
