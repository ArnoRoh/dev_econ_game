/**
 * The campaign is twenty-five cabinet sessions, not seventy annual turns.
 *
 * A session is a sitting of the cabinet in a named year, followed by the years
 * that sitting has to live with. Seventy consecutive decisions turned the middle
 * of a run into administration; twenty-five make each one a hinge, and the years
 * between them are where consequences mature.
 *
 * The schedule is authored rather than derived, for two reasons. It lets the
 * spans breathe — a session can be given a single year when something is about
 * to break, and four when the decade is quiet — and it guarantees that the years
 * the world intervenes in (`src/data/crises.ts`) land on a session boundary
 * rather than somewhere in the middle of a montage where the player cannot act.
 *
 * Invariants, asserted below: twenty-five sessions, spans summing to seventy,
 * first year 1960, last session closing in 2030.
 */

export interface Chapter {
    /** 1-based session number; this is what `GameState.turn` holds. */
    index: number;
    /** Year the cabinet sits. */
    year: number;
    /** Years simulated after the session's decisions resolve. */
    span: number;
    /** Shown on the session card. */
    title: string;
    /** The decade's character, in one line. */
    subtitle: string;
}

const SCHEDULE: Array<[year: number, span: number, title: string, subtitle: string]> = [
    [1960, 3, 'Year Zero', 'The flag is raised over institutions built to serve someone else.'],
    [1963, 3, 'The First Budget', 'Everything is a priority, and the treasury is one column wide.'],
    [1966, 3, 'The Long Plan', 'The decade of blueprints: dams, mills, and five-year arithmetic.'],
    [1969, 3, 'The Reckoning of the Countryside', 'Whoever holds the land holds the harvest, and the votes.'],
    [1972, 1, 'A Quiet Year', 'Nothing on the horizon, which is what horizons look like beforehand.'],
    [1973, 3, 'The Oil Shock', 'Four times the price, overnight, and the fuel bill will not wait.'],
    [1976, 3, 'Cheap Money', 'The banks are lending petrodollars to anyone with a flag.'],
    [1979, 3, 'The Second Shock', 'Oil again — and this time Washington answers with interest rates.'],
    [1982, 3, 'The Debt Crisis', 'The loans of the seventies come due in the currency of the eighties.'],
    [1985, 3, 'Adjustment', 'The conditions attached to rescue are written by the rescuer.'],
    [1988, 2, 'The Lost Decade', 'A generation of growth that went to service, not to schools.'],
    [1990, 3, 'The Wall Comes Down', 'The bloc that paid for non-alignment has stopped paying.'],
    [1993, 3, 'The Washington Consensus', 'Open, privatise, deregulate — and the model is not optional.'],
    [1996, 2, 'Hot Money', 'Capital arrives quickly, and leaves faster than it came.'],
    [1998, 3, 'Contagion', 'A currency breaks a continent away and the creditors stop asking who is solvent.'],
    [2001, 3, 'The Commodity Turn', 'Someone very large has started buying everything you dig up.'],
    [2004, 4, 'The Boom', 'Terms of trade have never been kinder. This is the dangerous part.'],
    [2008, 3, 'The Great Recession', 'The centre defaults on its own rules; the periphery pays anyway.'],
    [2011, 3, 'After the Boom', 'The prices came down. The spending commitments did not.'],
    [2014, 3, 'The Middle-Income Question', 'Too expensive to be cheap, too unskilled to be dear.'],
    [2017, 3, 'The Political Settlement', 'Whoever the growth left behind has organised.'],
    [2020, 3, 'The Pandemic', 'A closed world, and a state that finds out what it can actually deliver.'],
    [2023, 3, 'The Reckoning', 'Sixty years of choices, arriving all at once.'],
    [2026, 2, 'The Handover', 'What will still be standing when someone else is holding it.'],
    [2028, 2, 'The Verdict of 2030', 'The last sitting. History takes its notes.'],
];

export const CHAPTERS: Chapter[] = SCHEDULE.map(([year, span, title, subtitle], position) => ({
    index: position + 1,
    year,
    span,
    title,
    subtitle,
}));

export const FIRST_YEAR = 1960;
export const FINAL_YEAR = 2030;
export const TOTAL_CHAPTERS = CHAPTERS.length;

/**
 * Average years per session, used to convert authored delays.
 *
 * The proposal corpus was written when one turn was one year, so every
 * `delayTurns` and `deadlineTurns` in `src/data` is really a count of *years*.
 * Rather than rewrite hundreds of authored numbers — and risk changing what an
 * author meant — the engine converts them at the point of use.
 */
export const YEARS_PER_CHAPTER = (FINAL_YEAR - FIRST_YEAR) / TOTAL_CHAPTERS;

/** Convert an authored delay in years into a number of sessions, never below one. */
export const yearsToChapters = (years: number): number =>
    Math.max(1, Math.round(years / YEARS_PER_CHAPTER));

export const chapterAt = (index: number): Chapter =>
    CHAPTERS[Math.min(Math.max(index, 1), TOTAL_CHAPTERS) - 1];

export const isFinalChapter = (index: number): boolean => index >= TOTAL_CHAPTERS;

/**
 * The session a given year falls inside.
 *
 * Used to migrate saves written when a turn was a year: a run paused in 1977 is
 * resumed in the session that covers 1977, rather than at session 17 because
 * that was the seventeenth year.
 */
export const chapterIndexForYear = (year: number): number => {
    for (let position = CHAPTERS.length - 1; position >= 0; position -= 1) {
        if (year >= CHAPTERS[position].year) return CHAPTERS[position].index;
    }
    return 1;
};

/**
 * Sessions that open with a development plan.
 *
 * The old cadence was `year % 5`, which cannot survive an irregular schedule —
 * only four of the twenty-five sitting years are divisible by five. Every third
 * session preserves the intent (a plan roughly every eight years, eight of them
 * across the run) and, unlike the year test, it cannot silently stop firing.
 *
 * `buildProject` and the project-due check in `App.tsx` both read this.
 */
export const isDevelopmentPlanChapter = (index: number): boolean =>
    index >= 2 && (index - 2) % 3 === 0;

/**
 * Sessions that open with a diplomatic summit: 1966, 1976, 1990, 2001, 2017.
 *
 * Chosen to avoid the crisis sessions — a summit and a world emergency in the
 * same sitting would bury one of them.
 */
export const isSummitChapter = (index: number): boolean => [3, 7, 12, 16, 21].includes(index);

// The schedule is load-bearing for pacing, cadence and crisis alignment, so it
// is checked at module load rather than trusted. A bad edit fails immediately
// and locally instead of producing a campaign that quietly ends in the wrong year.
const spanTotal = CHAPTERS.reduce((sum, chapter) => sum + chapter.span, 0);
if (CHAPTERS[0].year !== FIRST_YEAR) {
    throw new Error(`Chapter schedule must open in ${FIRST_YEAR}, opens in ${CHAPTERS[0].year}`);
}
if (spanTotal !== FINAL_YEAR - FIRST_YEAR) {
    throw new Error(`Chapter spans total ${spanTotal} years, expected ${FINAL_YEAR - FIRST_YEAR}`);
}
CHAPTERS.forEach((chapter, position) => {
    const next = CHAPTERS[position + 1];
    if (next && chapter.year + chapter.span !== next.year) {
        throw new Error(
            `Chapter ${chapter.index} (${chapter.year} +${chapter.span}) does not meet chapter ${next.index} (${next.year})`,
        );
    }
});
