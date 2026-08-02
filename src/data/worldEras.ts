/**
 * The world outside the republic, as conditions rather than events.
 *
 * Before this existed the international economy was a single stat —
 * `internationalRelations` — that only moved when the player moved it. A country
 * that borrows in 1976 and a country that borrows in 1986 were borrowing on the
 * same terms, which is the one thing the historical record is unambiguous about
 * not being true.
 *
 * Four indices, authored against the actual post-war record, on a schedule the
 * player cannot influence and can entirely see coming. What they *can* choose is
 * their exposure: debt denominated abroad, an export sector, a mineral province.
 * The point of the layer is that structure decides who a given decade happens to.
 *
 * Indices are 100 = the 1960 baseline, except `interestRate`, which is a
 * percentage. `src/engine/worldLogic.ts` turns these into pressure on the sim.
 */

export interface WorldEra {
    /** Inclusive. */
    from: number;
    /** Inclusive. */
    to: number;
    /** Nominal cost of external borrowing, percent. */
    interestRate: number;
    /** Price of what the republic digs up and grows, index. */
    commodityPrice: number;
    /** Appetite abroad for what the republic manufactures, index. */
    exportDemand: number;
    /** How willing the world is to lend at all, index. */
    capitalAvailability: number;
    /** Shown in the dispatch panel, so the player can read the weather. */
    label: string;
    note: string;
}

export const WORLD_ERAS: WorldEra[] = [
    {
        from: 1960, to: 1972,
        interestRate: 4, commodityPrice: 100, exportDemand: 105, capitalAvailability: 95,
        label: 'The Long Boom',
        note: 'Industrial demand is growing steadily and credit is cheap but rationed. A good decade to be selling raw materials, and a hard one to borrow at scale.',
    },
    {
        from: 1973, to: 1978,
        interestRate: 3, commodityPrice: 138, exportDemand: 88, capitalAvailability: 155,
        label: 'Petrodollar Glut',
        note: 'Oil revenues are being recycled through Western banks faster than they can be lent. Money has never been easier to raise, and real interest rates are close to nothing. Loans taken now are the cheapest the century will offer — provided rates stay where they are.',
    },
    {
        from: 1979, to: 1981,
        interestRate: 11, commodityPrice: 120, exportDemand: 92, capitalAvailability: 90,
        label: 'The Volcker Shock',
        note: 'Washington has decided to break inflation with interest rates, and the rest of the world is not consulted. Anything borrowed at a floating rate is repricing upward right now.',
    },
    {
        from: 1982, to: 1989,
        interestRate: 12, commodityPrice: 74, exportDemand: 88, capitalAvailability: 35,
        label: 'The Lost Decade',
        note: 'Commodity prices have collapsed and lending to developing countries has effectively stopped. Debt contracted in the seventies is now serviced out of an economy earning a third less for its exports.',
    },
    {
        from: 1990, to: 1996,
        interestRate: 7, commodityPrice: 82, exportDemand: 108, capitalAvailability: 115,
        label: 'The Washington Consensus',
        note: 'Capital is flowing to emerging markets again, on conditions. Trade is growing quickly for anyone positioned to sell manufactures.',
    },
    {
        from: 1997, to: 2000,
        interestRate: 9, commodityPrice: 76, exportDemand: 92, capitalAvailability: 55,
        label: 'Contagion',
        note: 'A currency has broken on the other side of the world and creditors have stopped distinguishing between one developing economy and another. Short-term money is leaving.',
    },
    {
        from: 2001, to: 2007,
        interestRate: 5, commodityPrice: 150, exportDemand: 122, capitalAvailability: 125,
        label: 'The Commodity Supercycle',
        note: 'An economy of a billion people is industrialising and buying every input it can find. Terms of trade are the best they have ever been for a resource exporter — which is precisely when the resource curse is contracted.',
    },
    {
        from: 2008, to: 2010,
        interestRate: 7, commodityPrice: 105, exportDemand: 78, capitalAvailability: 55,
        label: 'The Great Recession',
        note: 'The financial centre has seized. Trade finance is scarce, export orders have been cancelled, and the countries that caused it are the ones being lent to.',
    },
    {
        from: 2011, to: 2014,
        interestRate: 4, commodityPrice: 140, exportDemand: 104, capitalAvailability: 125,
        label: 'The Search for Yield',
        note: 'Rates in the rich world are near zero and capital is looking anywhere for a return. Borrowing is cheap and abundant, which historically has been a warning rather than an opportunity.',
    },
    {
        from: 2015, to: 2019,
        interestRate: 5, commodityPrice: 88, exportDemand: 98, capitalAvailability: 100,
        label: 'The Turn',
        note: 'The supercycle is over. Budgets written against boom-era prices are now structurally short.',
    },
    {
        from: 2020, to: 2021,
        interestRate: 3, commodityPrice: 78, exportDemand: 68, capitalAvailability: 85,
        label: 'The Closed World',
        note: 'Borders are shut, supply chains have broken, and every state is discovering exactly how much it can actually deliver.',
    },
    {
        from: 2022, to: 2030,
        interestRate: 8, commodityPrice: 112, exportDemand: 96, capitalAvailability: 80,
        label: 'The Tightening',
        note: 'Inflation has returned and with it the cost of money. Debt taken on in the cheap decade is refinancing into an expensive one.',
    },
];

const BASELINE: WorldEra = WORLD_ERAS[0];

export const worldEraFor = (year: number): WorldEra =>
    WORLD_ERAS.find(era => year >= era.from && year <= era.to) ?? BASELINE;

// The eras must tile the campaign without gaps: a year that falls through would
// silently take the 1960 baseline, which is the kind of bug that shows up as
// "the debt crisis did nothing" rather than as an error.
WORLD_ERAS.forEach((era, position) => {
    const next = WORLD_ERAS[position + 1];
    if (next && era.to + 1 !== next.from) {
        throw new Error(`World eras leave a gap between ${era.to} and ${next.from}`);
    }
});
