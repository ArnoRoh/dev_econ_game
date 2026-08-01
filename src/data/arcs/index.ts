import type { PolicyProposal } from '../../engine/types.ts';
import { LAND_REFORM_ARC } from './landReformArc.ts';
import { LEGACY_PROPOSALS } from './legacyProposals.ts';

export { LAND_REFORM_ARC } from './landReformArc.ts';
export { LEGACY_PROPOSALS } from './legacyProposals.ts';

/** The authored arcs available to the agenda engine as they are introduced. */
export const POLICY_ARCS = {
    landReform: LAND_REFORM_ARC,
} as const;

/**
 * Flat proposal list for agenda selection and content validation.
 *
 * Authored arc steps come first so they win selection priority; the adapted
 * legacy corpus fills the remaining agenda slots in years when no arc step is
 * live, which is most of a seventy-year campaign.
 */
export const ALL_POLICY_PROPOSALS: PolicyProposal[] = [
    ...LAND_REFORM_ARC,
    ...LEGACY_PROPOSALS,
];
