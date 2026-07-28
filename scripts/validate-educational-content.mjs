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
]);

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
}

if (errors.length > 0) {
    console.error('Educational content validation failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
} else {
    console.log(`Educational content valid: ${ECONOMIC_CONCEPTS.length} concepts, ${SOURCES.length} sources.`);
}
