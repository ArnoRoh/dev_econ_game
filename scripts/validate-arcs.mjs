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

const authored = ALL_POLICY_PROPOSALS.filter(p => !p.isGeneric);
const generic = ALL_POLICY_PROPOSALS.filter(p => p.isGeneric);

if (problems.length) {
    console.error(`Arc validation FAILED with ${problems.length} problem(s):`);
    problems.forEach(problem => console.error(` - ${problem}`));
    process.exit(1);
}

console.log(
    `Arcs valid: ${Object.keys(POLICY_ARCS).length} arcs, ${authored.length} authored proposals, ` +
        `${generic.length} standing-business proposals, ${seenOptionIds.size} options.`,
);
