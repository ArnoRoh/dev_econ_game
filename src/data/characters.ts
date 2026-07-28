import type { CharacterDefinition } from '../engine/types';

export const CHARACTERS: CharacterDefinition[] = [
    {
        id: 'finance_minister',
        name: 'Mara Vuković',
        title: 'Finance Minister',
        factionId: 'business',
        publicGoal: 'Build a solvent state that can invest without losing the confidence of employers and lenders.',
        privateGoal: 'Use the new republic’s budget discipline to make the commercial league indispensable to every future government.',
    },
    {
        id: 'army_chief',
        name: 'General Idris Kallon',
        title: 'Army Chief',
        factionId: 'military',
        publicGoal: 'Keep the young republic secure while civilian institutions learn to govern.',
        privateGoal: 'Preserve the command’s autonomy and make the army the final guarantor of the national project.',
    },
    {
        id: 'labor_leader',
        name: 'Rosa Ndlovu',
        title: 'Labor Leader',
        factionId: 'labor',
        publicGoal: 'Make growth visible in workers’ pay, safety, and bargaining power.',
        privateGoal: 'Turn the workers congress into a permanent governing partner rather than a pressure group called only during crises.',
    },
    {
        id: 'provincial_chair',
        name: 'Mateo Okoro',
        title: 'Provincial Chair',
        factionId: 'provincial',
        publicGoal: 'Ensure the countryside receives roads, credit, and a meaningful voice in national decisions.',
        privateGoal: 'Build a coalition of provincial councils strong enough to resist every attempt to rule from the capital alone.',
    },
];

export const CHARACTERS_BY_ID: Record<CharacterDefinition['id'], CharacterDefinition> = Object.fromEntries(
    CHARACTERS.map(character => [character.id, character]),
) as Record<CharacterDefinition['id'], CharacterDefinition>;
