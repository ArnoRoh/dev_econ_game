import { ECONOMIC_CONCEPTS } from '../src/data/concepts.ts';
import { SOURCES } from '../src/data/sources.ts';

const expectedConceptIds = new Set([
    'land_tenure',
    'green_revolution',
    'import_substitution',
    'export_orientation',
    'infant_industry',
    'labor_standards',
    'dutch_disease',
    'sovereign_wealth_fund',
    'resource_curse',
    // The industrial-policy and export-led layer.
    'developmental_state',
    'dynamic_comparative_advantage',
    'miracle_accounting_debate',
    'fallacy_of_composition',
    'premature_deindustrialization',
    'self_discovery',
    'exchange_rate_undervaluation',
    'global_value_chains',
    'middle_income_trap',
    'washington_consensus',
    'state_capacity',
    'learning_by_exporting',
]);

/**
 * Concepts whose whole purpose is that the profession does not agree about
 * them. These must carry the contestation fields — a dossier that presents the
 * East Asian miracle debate as settled fact is the specific failure this
 * content layer exists to prevent.
 */
const MUST_STATE_CONTESTATION = new Set([
    'developmental_state',
    'dynamic_comparative_advantage',
    'miracle_accounting_debate',
    'fallacy_of_composition',
    'premature_deindustrialization',
    'self_discovery',
    'exchange_rate_undervaluation',
    'middle_income_trap',
    'washington_consensus',
    'learning_by_exporting',
]);

const CONTESTATION_LEVELS = new Set(['well-supported', 'contested', 'actively-disputed']);

const errors = [];

const findDuplicates = values => {
    const seen = new Set();
    const duplicates = new Set();

    for (const value of values) {
        if (seen.has(value)) duplicates.add(value);
        seen.add(value);
    }

    return duplicates;
};

const sourceIds = SOURCES.map(source => source.id);
for (const duplicateId of findDuplicates(sourceIds)) {
    errors.push(`Duplicate source id: ${duplicateId}`);
}
const conceptIds = ECONOMIC_CONCEPTS.map(concept => concept.id);
for (const duplicateId of findDuplicates(conceptIds)) {
    errors.push(`Duplicate concept id: ${duplicateId}`);
}

for (const expectedId of expectedConceptIds) {
    if (!conceptIds.includes(expectedId)) errors.push(`Missing required concept: ${expectedId}`);
}

for (const unexpectedId of conceptIds) {
    if (!expectedConceptIds.has(unexpectedId)) errors.push(`Unexpected concept: ${unexpectedId}`);
}

const sourceIdSet = new Set(sourceIds);
for (const concept of ECONOMIC_CONCEPTS) {
    if (!concept.mechanismSteps.length || concept.mechanismSteps.some(step => !step.trim())) {
        errors.push(`Concept ${concept.id} must have non-empty mechanism steps`);
    }

    if (concept.sourceIds.length < 2) {
        errors.push(`Concept ${concept.id} must reference at least two sources`);
    }

    for (const sourceId of concept.sourceIds) {
        if (!sourceIdSet.has(sourceId)) {
            errors.push(`Concept ${concept.id} references missing source: ${sourceId}`);
        }
    }

    // A concept with one competing view is a concept with a token objection
    // attached. Two is the minimum for the player to see a disagreement rather
    // than a caveat.
    if (concept.competingViews.length < 2) {
        errors.push(`Concept ${concept.id} must state at least two competing views`);
    }

    if (concept.commonMisconceptions.length < 2) {
        errors.push(`Concept ${concept.id} must state at least two common misconceptions`);
    }

    if (concept.contestation && !CONTESTATION_LEVELS.has(concept.contestation)) {
        errors.push(
            `Concept ${concept.id} has unknown contestation level: ${concept.contestation}`,
        );
    }

    if (MUST_STATE_CONTESTATION.has(concept.id)) {
        if (!concept.contestation) {
            errors.push(`Concept ${concept.id} is a disputed claim and must declare a contestation level`);
        }
        if (!concept.strongestObjection?.trim()) {
            errors.push(`Concept ${concept.id} must name the strongest published objection to it`);
        }
        if (!concept.whatWouldFalsifyIt?.trim()) {
            errors.push(`Concept ${concept.id} must state what would show it is wrong`);
        }
    }
}

if (errors.length > 0) {
    console.error('Educational content validation failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
} else {
    console.log(`Educational content valid: ${ECONOMIC_CONCEPTS.length} concepts, ${SOURCES.length} sources.`);
}
