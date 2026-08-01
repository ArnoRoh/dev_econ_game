import type { KnowledgeCheck } from '../engine/types';

/**
 * One check per concept. These fire after a concept has been met twice, never
 * during a decision, and never cost the player anything — a wrong answer buys
 * an explanation, a right one buys an Advisor Insight token.
 *
 * Every distractor is a real misconception rather than an obviously silly
 * option, because the point is to catch the plausible wrong model.
 */
export const KNOWLEDGE_CHECKS: KnowledgeCheck[] = [
    {
        id: 'check_land_tenure',
        conceptId: 'land_tenure',
        prompt:
            'A tenant farmer and an owner-occupier work identical plots with identical soil. The owner consistently invests more in terracing and tree crops. What best explains the gap?',
        answers: [
            { id: 'a', text: 'Owners are better farmers than tenants.' },
            { id: 'b', text: 'The tenant cannot be sure of capturing returns that arrive years later.' },
            { id: 'c', text: 'Tenants have less physical labour available.' },
            { id: 'd', text: 'Terracing is only legal on owned land.' },
        ],
        correctAnswerId: 'b',
        explanation:
            'Investment horizon is the mechanism. Terracing and tree crops pay back over many seasons, so they are only rational if you expect to still hold the land. Insecure tenure truncates the horizon, and the farmer rationally invests in this year\'s crop instead. It is a difference in incentives, not in ability.',
    },
    {
        id: 'check_green_revolution',
        conceptId: 'green_revolution',
        prompt:
            'Two districts adopt the same high-yield seed package. In one, inequality falls; in the other, it rises sharply. What most plausibly differs?',
        answers: [
            { id: 'a', text: 'Access to credit and extension advice for smallholders.' },
            { id: 'b', text: 'The quality of the seed delivered.' },
            { id: 'c', text: 'Rainfall in the first season.' },
            { id: 'd', text: 'The number of hectares planted overall.' },
        ],
        correctAnswerId: 'a',
        explanation:
            'The seed package is capital-intensive: it needs fertiliser, water control and know-how. Where only large farmers can finance the complements, the technology raises their yields and bids up land values, concentrating holdings. Where credit and extension reach smallholders, the same technology is broadly shared. The distributional outcome is set by the institutions around the technology, not by the technology.',
    },
    {
        id: 'check_import_substitution',
        conceptId: 'import_substitution',
        prompt:
            'A country protects its new appliance industry with high tariffs. Twenty years on, the firms still cannot export. What is the standard diagnosis?',
        answers: [
            { id: 'a', text: 'The tariffs were set too low to be effective.' },
            { id: 'b', text: 'Consumers preferred imports for cultural reasons.' },
            { id: 'c', text: 'A guaranteed captive market removed the pressure to cut costs.' },
            { id: 'd', text: 'The industry was inherently unsuited to the country.' },
        ],
        correctAnswerId: 'c',
        explanation:
            'Infant-industry protection is meant to buy time for learning. It only works when the protection is conditional and temporary. Open-ended protection guarantees domestic sales regardless of performance, so the profitable investment becomes lobbying to keep the tariff rather than engineering to lower the cost. The failure is in the absence of a sunset clause, not in the initial logic.',
    },
    {
        id: 'check_export_orientation',
        conceptId: 'export_orientation',
        prompt:
            'Why did the East Asian states use export performance as the test for continued subsidy?',
        answers: [
            { id: 'a', text: 'Exports were more profitable than domestic sales.' },
            { id: 'b', text: 'Foreign buyers cannot be lobbied, so they provide honest performance data.' },
            { id: 'c', text: 'International agreements required it.' },
            { id: 'd', text: 'Domestic demand was legally restricted.' },
        ],
        correctAnswerId: 'b',
        explanation:
            'Amsden called this reciprocal control. Any subsidy scheme faces the problem of knowing which firms are actually improving. Domestic sales figures can be manufactured by a protected market or a friendly ministry; an export order from a foreign buyer with alternatives cannot. The world market did the auditing the state was not capable of doing itself.',
    },
    {
        id: 'check_infant_industry',
        conceptId: 'infant_industry',
        prompt:
            'What single design feature most distinguishes infant-industry protection that worked from protection that did not?',
        answers: [
            { id: 'a', text: 'A credible expiry date with performance conditions.' },
            { id: 'b', text: 'A higher initial tariff rate.' },
            { id: 'c', text: 'State rather than private ownership of the firms.' },
            { id: 'd', text: 'Protection of consumer goods rather than capital goods.' },
        ],
        correctAnswerId: 'a',
        explanation:
            'The economic case for protection rests entirely on learning: costs are meant to fall until the firm can survive unprotected. If the firm knows the shelter is permanent, no learning is required for it to remain profitable. The expiry date is what converts protection from a subsidy into an investment.',
    },
    {
        id: 'check_labor_standards',
        conceptId: 'labor_standards',
        prompt:
            'A foreign investor asks for exemption from safety rules, arguing the jobs are still better than the alternative. What does the standard critique say this misses?',
        answers: [
            { id: 'a', text: 'That the jobs are not in fact better than subsistence farming.' },
            { id: 'b', text: 'That competing only on cheap labour blocks the move to higher-value production.' },
            { id: 'c', text: 'That foreign investment never raises wages anywhere.' },
            { id: 'd', text: 'That factory work is always less productive than agriculture.' },
        ],
        correctAnswerId: 'b',
        explanation:
            'Both sides of this argument are partly right, which is why it recurs. Krugman is correct that a low-wage factory job usually beats the alternative available. The critique is about trajectory: if the only competitive advantage is cheap unprotected labour, the country has no reason to upgrade skills and the investor has every reason to leave when wages rise. The question is not whether the job is better today but whether the strategy leads anywhere.',
    },
    {
        id: 'check_dutch_disease',
        conceptId: 'dutch_disease',
        prompt:
            'An oil discovery is followed by the collapse of a previously healthy cocoa export sector. What is the transmission mechanism?',
        answers: [
            { id: 'a', text: 'Farmers abandoned cocoa to work in the oil fields.' },
            { id: 'b', text: 'Foreign currency inflows appreciated the exchange rate, pricing cocoa out of world markets.' },
            { id: 'c', text: 'Oil extraction physically damaged the cocoa-growing regions.' },
            { id: 'd', text: 'World cocoa demand happened to fall at the same time.' },
        ],
        correctAnswerId: 'b',
        explanation:
            'The mechanism is monetary before it is anything else. Foreign buyers must acquire local currency to pay for the oil, which bids the currency up. A stronger currency makes every other export more expensive abroad — the cocoa farmer\'s costs are in local currency but the price is set in dollars. Labour movement into the resource sector is a real but secondary effect; the exchange rate does most of the damage.',
    },
    {
        id: 'check_sovereign_wealth_fund',
        conceptId: 'sovereign_wealth_fund',
        prompt:
            'Why must a sovereign wealth fund hold its assets abroad to counter Dutch disease?',
        answers: [
            { id: 'a', text: 'Foreign assets earn higher returns than domestic ones.' },
            { id: 'b', text: 'Domestic investment is prohibited under IMF rules.' },
            { id: 'c', text: 'Spending the foreign currency at home is what appreciates the exchange rate.' },
            { id: 'd', text: 'It protects the fund from domestic corruption.' },
        ],
        correctAnswerId: 'c',
        explanation:
            'Sterilisation is the point. The damage comes from converting resource dollars into local currency and spending them domestically, which is precisely what pushes the exchange rate up. Holding the assets offshore keeps that inflow out of the domestic money supply. Corruption-proofing and returns are real secondary benefits, but the exchange-rate logic is why the assets must be foreign.',
    },
    {
        id: 'check_resource_curse',
        conceptId: 'resource_curse',
        prompt:
            'Beyond exchange rates, why do resource rents tend to weaken state institutions?',
        answers: [
            { id: 'a', text: 'Resource extraction requires fewer educated workers.' },
            { id: 'b', text: 'A state funded by rents does not need to bargain with taxpayers.' },
            { id: 'c', text: 'Mining companies always insist on weak regulation.' },
            { id: 'd', text: 'Resource wealth is inherently harder to measure.' },
        ],
        correctAnswerId: 'b',
        explanation:
            'The fiscal-contract argument. Historically, states that had to tax their citizens to survive were forced to concede representation, build the administrative machinery to assess and collect, and justify their spending. A government funded by a single export terminal needs none of that: it needs to control the terminal. Botswana is the counter-example that shows this is a tendency rather than a law.',
    },
];

export const CHECKS_BY_CONCEPT = new Map(
    KNOWLEDGE_CHECKS.map(check => [check.conceptId, check]),
);
