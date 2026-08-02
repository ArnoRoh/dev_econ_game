/**
 * What accumulates across runs.
 *
 * A roguelite has to answer "why replay this?" with something other than a
 * different random seed. The answer here is deliberately not raw power — a
 * campaign that gets easier each time would flatten the very tradeoffs the game
 * is about. What carries over is *institutional memory*: the state gets better
 * at knowing things, and the player inherits a civil service that has seen this
 * before.
 *
 * So the unlock curve runs from information, through capacity, to options:
 *   - early unlocks make the advisors legible (who lies, and about what),
 *   - middle unlocks give foresight (the decade ahead, the crisis's severity),
 *   - late unlocks add capacity and genuinely new policy.
 *
 * The one unlock that changes the shape of the game — a third action slot —
 * sits at the end of the curve on purpose, and even then it applies only to
 * ordinary sessions. A crisis still takes the whole sitting, however
 * experienced the government is.
 */

export type UnlockId =
    | 'advisor_record'
    | 'advisor_bias'
    | 'world_almanac'
    | 'crisis_briefing'
    | 'province_survey'
    | 'sovereign_fund_policy'
    | 'statistical_service'
    | 'third_action';

export interface UnlockDefinition {
    id: UnlockId;
    name: string;
    /** What the player gets, in their terms. */
    description: string;
    /** Why a state would actually have this, in the game's terms. */
    flavour: string;
    /** Cumulative institutional memory required. */
    threshold: number;
}

export const UNLOCKS: UnlockDefinition[] = [
    {
        id: 'advisor_record',
        name: 'The Cabinet Record',
        description: 'Dossiers show how often each advisor\'s past forecasts proved right.',
        flavour: 'Somebody finally started keeping minutes, and the minutes are checkable.',
        threshold: 60,
    },
    {
        id: 'advisor_bias',
        name: 'Reading the Room',
        description: 'Advisors\' systematic leans are named: who overpromises, who cries wolf.',
        flavour: 'Every ministry reports the indicator that flatters it. Knowing which one is half the job.',
        threshold: 160,
    },
    {
        id: 'world_almanac',
        name: 'The Almanac',
        description: 'The coming decade\'s world conditions are visible before the session, not after.',
        flavour: 'A research desk that reads the foreign press and is occasionally listened to.',
        threshold: 300,
    },
    {
        id: 'crisis_briefing',
        name: 'Contingency Planning',
        description: 'A crisis states how exposed the republic is before you choose your answer.',
        flavour: 'The difference between a government that is surprised and one that is merely unlucky.',
        threshold: 460,
    },
    {
        id: 'province_survey',
        name: 'The Survey Office',
        description: 'Province conditions and year-on-year change are reported in full.',
        flavour: 'You cannot govern a district you have never measured.',
        threshold: 640,
    },
    {
        id: 'sovereign_fund_policy',
        name: 'The Stabilisation Fund',
        description: 'Adds a standing policy: save commodity revenue against the next price collapse.',
        flavour: 'Learned the way every country that has one learned it — by not having one during a bust.',
        threshold: 850,
    },
    {
        id: 'statistical_service',
        name: 'The Statistical Service',
        description: 'Debriefs report the full numeric outcome of every decision, including the ones you declined.',
        flavour: 'A state that measures what it did, whether or not the answer is welcome.',
        threshold: 1100,
    },
    {
        id: 'third_action',
        name: 'A Working Cabinet',
        description: 'Three actions per ordinary session instead of two. Crises still take the whole sitting.',
        flavour: 'Sixty years of practice at governing, carried into the first year of the next attempt.',
        threshold: 1400,
    },
];

export const unlockById = (id: UnlockId): UnlockDefinition | undefined =>
    UNLOCKS.find(unlock => unlock.id === id);

/** Every unlock earned at a given level of accumulated memory. */
export const unlocksFor = (memory: number): UnlockId[] =>
    UNLOCKS.filter(unlock => memory >= unlock.threshold).map(unlock => unlock.id);

/** The next thing to work toward, for the profile screen. */
export const nextUnlock = (memory: number): UnlockDefinition | null =>
    UNLOCKS.find(unlock => memory < unlock.threshold) ?? null;
