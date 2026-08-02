import type { PolicyProposal } from '../../engine/types.ts';
import { INDUSTRIAL_STRATEGY_ARC } from './industrialStrategyArc.ts';
import { LAND_REFORM_ARC } from './landReformArc.ts';
import { RESOURCE_BOOM_ARC } from './resourceBoomArc.ts';
import { DEVELOPMENTAL_STATE_ARC } from './developmentalStateArc.ts';
import { EXPORT_LED_ARC } from './exportLedArc.ts';
import { LEGACY_PROPOSALS } from './legacyProposals.ts';

export { INDUSTRIAL_STRATEGY_ARC } from './industrialStrategyArc.ts';
export { LAND_REFORM_ARC } from './landReformArc.ts';
export { RESOURCE_BOOM_ARC } from './resourceBoomArc.ts';
export { DEVELOPMENTAL_STATE_ARC } from './developmentalStateArc.ts';
export { EXPORT_LED_ARC } from './exportLedArc.ts';
export { LEGACY_PROPOSALS } from './legacyProposals.ts';

/** The authored arcs available to the agenda engine as they are introduced. */
export const POLICY_ARCS = {
    landReform: LAND_REFORM_ARC,
    industrialStrategy: INDUSTRIAL_STRATEGY_ARC,
    resourceBoom: RESOURCE_BOOM_ARC,
    developmentalState: DEVELOPMENTAL_STATE_ARC,
    exportLed: EXPORT_LED_ARC,
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
    ...INDUSTRIAL_STRATEGY_ARC,
    ...RESOURCE_BOOM_ARC,
    ...DEVELOPMENTAL_STATE_ARC,
    ...EXPORT_LED_ARC,
    ...LEGACY_PROPOSALS,
];
