/**
 * Structural validation for policy arcs.
 *
 * The educational content validator checks concepts and sources. This one checks
 * the proposals themselves: that ids are unique, that every referenced concept,
 * source, sponsor and faction exists, that arc steps form an unbroken sequence,
 * that every required flag is actually settable by something earlier, and that
 * no promise is unkeepable by construction.
 *
 * These are the failure modes that produce a silently unreachable proposal or a
 * promise the player can never keep, neither of which the type system can catch.
 */
import { ALL_POLICY_PROPOSALS, POLICY_ARCS } from '../src/data/arcs/index.ts';
import { ECONOMIC_CONCEPTS } from '../src/data/concepts.ts';
import { SOURCES } from '../src/data/sources.ts';
import { CHARACTERS } from '../src/data/characters.ts';
import { FACTIONS } from '../src/data/factions.ts';
import { ACHIEVEMENTS } from '../src/data/achievements.ts';
import { KNOWLEDGE_CHECKS } from '../src/data/knowledgeChecks.ts';
import { PROGRAMMES } from '../src/data/programmes.ts';
import { BASE_PROVINCES } from '../src/data/provinces.ts';

/** Flags set by the engine and crisis content rather than by an arc option. */
const ENGINE_FLAGS = new Set([
    'imf_program', 'non_aligned', 'authoritarian_turn', 'democratic',
    'peaceful_transfer', 'stolen_election', 'defaulted', 'restructured',
]);

const conceptIds = new Set(ECONOMIC_CONCEPTS.map(c => c.id));
const sourceIds = new Set(SOURCES.map(s => s.id));
const characterIds = new Set(CHARACTERS.map(c => c.id));
const factionIds = new Set(FACTIONS.map(f => f.id));

const problems = [];
const note = message => problems.push(message);

// --- ids -------------------------------------------------------------------
const seenProposalIds = new Set();
const seenOptionIds = new Set();

for (const proposal of ALL_POLICY_PROPOSALS) {
    if (seenProposalIds.has(proposal.id)) note(`duplicate proposal id: ${proposal.id}`);
    seenProposalIds.add(proposal.id);

    if (!characterIds.has(proposal.sponsorId)) {
        note(`${proposal.id}: unknown sponsorId ${proposal.sponsorId}`);
    }
    for (const concept of proposal.conceptIds ?? []) {
        if (!conceptIds.has(concept)) note(`${proposal.id}: unknown conceptId ${concept}`);
    }
    for (const source of proposal.sourceIds ?? []) {
        if (!sourceIds.has(source)) note(`${proposal.id}: unknown sourceId ${source}`);
    }
    if (!proposal.ignoreOutcome) note(`${proposal.id}: missing ignoreOutcome`);
    if (!proposal.options?.length) note(`${proposal.id}: no options`);
    if ((proposal.options?.length ?? 0) < 2 && !proposal.isGeneric) {
        note(`${proposal.id}: authored proposals need at least two options`);
    }

    for (const option of proposal.options ?? []) {
        if (seenOptionIds.has(option.id)) note(`duplicate option id: ${option.id}`);
        seenOptionIds.add(option.id);

        for (const concept of option.conceptIds ?? []) {
            if (!conceptIds.has(concept)) note(`${option.id}: unknown conceptId ${concept}`);
        }
        for (const source of option.sourceIds ?? []) {
            if (!sourceIds.has(source)) note(`${option.id}: unknown sourceId ${source}`);
        }
        for (const effect of option.factionEffects ?? []) {
            if (!factionIds.has(effect.factionId)) {
                note(`${option.id}: unknown factionId ${effect.factionId}`);
            }
        }
        for (const forecast of option.forecasts ?? []) {
            if (!characterIds.has(forecast.advisorId)) {
                note(`${option.id}: unknown advisorId ${forecast.advisorId}`);
            }
        }
        if (!proposal.isGeneric && (option.forecasts?.length ?? 0) < 2) {
            note(`${option.id}: authored options need forecasts from at least two advisors`);
        }
    }
}

// --- flags -----------------------------------------------------------------
// Every flag an option or consequence can set, plus flags the wider game sets.
const settableFlags = new Set([
    'imf_program',
    'non_aligned',
    'authoritarian_turn',
    'land_reform_enacted',
    'green_revolution_active',
]);

for (const proposal of ALL_POLICY_PROPOSALS) {
    for (const option of proposal.options ?? []) {
        (option.setFlags ?? []).forEach(flag => settableFlags.add(flag));
        for (const consequence of option.delayedConsequences ?? []) {
            (consequence.setsFlags ?? []).forEach(flag => settableFlags.add(flag));
        }
    }
    (proposal.ignoreOutcome?.setsFlags ?? []).forEach(flag => settableFlags.add(flag));
}

for (const proposal of ALL_POLICY_PROPOSALS) {
    for (const flag of proposal.requiredFlags ?? []) {
        if (!settableFlags.has(flag)) {
            note(`${proposal.id}: requires flag "${flag}" that nothing sets — proposal is unreachable`);
        }
    }
    for (const option of proposal.options ?? []) {
        for (const consequence of option.delayedConsequences ?? []) {
            for (const flag of consequence.requiredFlags ?? []) {
                if (!settableFlags.has(flag)) {
                    note(`${consequence.id}: requires flag "${flag}" that nothing sets — consequence can never fire`);
                }
            }
        }
        if (option.createsPromise && !settableFlags.has(option.createsPromise.completionFlag)) {
            note(
                `${option.id}: promise "${option.createsPromise.id}" completes on flag ` +
                    `"${option.createsPromise.completionFlag}" that nothing sets — it can only ever be broken`,
            );
        }
    }
}

// --- arc sequencing --------------------------------------------------------
for (const [name, arc] of Object.entries(POLICY_ARCS)) {
    const steps = [...new Set(arc.map(proposal => proposal.arcStep))].sort((a, b) => a - b);
    if (steps[0] !== 1) note(`arc ${name}: does not start at step 1`);
    steps.forEach((step, index) => {
        if (step !== index + 1) note(`arc ${name}: step sequence has a gap at ${step}`);
    });

    const arcIds = new Set(arc.map(proposal => proposal.arcId));
    if (arcIds.size !== 1) note(`arc ${name}: mixes arcIds ${[...arcIds].join(', ')}`);
}

// Achievements gate on flags too. One that nothing sets is unearnable, which
// is invisible in play and impossible to notice by testing.
for (const achievement of ACHIEVEMENTS) {
    const source = achievement.earned.toString();
    for (const match of source.matchAll(/flags\.([a-zA-Z_0-9]+)/g)) {
        if (!settableFlags.has(match[1]) && !ENGINE_FLAGS.has(match[1])) {
            note(`achievement ${achievement.id}: gates on flag "${match[1]}" that nothing sets`);
        }
    }
}

// A threshold above the number of checks that exist is silently unearnable.
for (const achievement of ACHIEVEMENTS) {
    const source = achievement.earned.toString();
    if (!/answeredChecks|correctKnowledgeChecks/.test(source)) continue;
    for (const match of source.matchAll(/>=\s*(\d+)/g)) {
        if (Number(match[1]) > KNOWLEDGE_CHECKS.length) {
            note(
                `achievement ${achievement.id}: needs ${match[1]} knowledge checks but only ` +
                    `${KNOWLEDGE_CHECKS.length} exist`,
            );
        }
    }
}

// Development programmes cite the same concept and source corpus the proposals do,
// and an endowment gate no province can clear is a programme that silently never
// appears — neither of which the type system can see.
const seenProgrammeIds = new Set();

for (const programme of PROGRAMMES) {
    if (seenProgrammeIds.has(programme.id)) note(`duplicate programme id: ${programme.id}`);
    seenProgrammeIds.add(programme.id);

    for (const concept of programme.conceptIds ?? []) {
        if (!conceptIds.has(concept)) note(`programme ${programme.id}: unknown conceptId ${concept}`);
    }
    for (const source of programme.sourceIds ?? []) {
        if (!sourceIds.has(source)) note(`programme ${programme.id}: unknown sourceId ${source}`);
    }
    if (!(programme.cost > 0)) note(`programme ${programme.id}: cost must be positive`);
    if (!programme.forecast) note(`programme ${programme.id}: missing forecast`);

    const gate = programme.requires;
    if (gate) {
        const eligible = BASE_PROVINCES.filter(province => province[gate.field] >= gate.atLeast);
        if (eligible.length === 0) {
            note(
                `programme ${programme.id}: requires ${gate.field} >= ${gate.atLeast}, which no province ` +
                    `has at game start — it can never be offered`,
            );
        }
    }
}

const authored = ALL_POLICY_PROPOSALS.filter(p => !p.isGeneric);
const generic = ALL_POLICY_PROPOSALS.filter(p => p.isGeneric);

if (problems.length) {
    console.error(`Arc validation FAILED with ${problems.length} problem(s):`);
    problems.forEach(problem => console.error(` - ${problem}`));
    process.exit(1);
}

console.log(
    `Arcs valid: ${Object.keys(POLICY_ARCS).length} arcs, ${authored.length} authored proposals, ` +
        `${generic.length} standing-business proposals, ${seenOptionIds.size} options, ` +
        `${PROGRAMMES.length} development programmes.`,
);
