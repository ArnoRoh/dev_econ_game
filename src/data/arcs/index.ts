import type { PolicyProposal } from '../../engine/types.ts';
import { LAND_REFORM_ARC } from './landReformArc.ts';

export { LAND_REFORM_ARC } from './landReformArc.ts';

/** The authored arcs available to the agenda engine as they are introduced. */
export const POLICY_ARCS = {
    landReform: LAND_REFORM_ARC,
} as const;

/** Flat proposal list for agenda selection and content validation. */
export const ALL_POLICY_PROPOSALS = [
    ...LAND_REFORM_ARC,
] satisfies readonly PolicyProposal[];
