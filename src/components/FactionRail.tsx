import type { CharacterId, CharacterState, FactionId, FactionState, PromiseRecord } from '../engine/types';
import { FACTIONS } from '../data/factions';
import { CHARACTERS_BY_ID } from '../data/characters';
import './FactionRail.css';

interface FactionRailProps {
    factions?: Record<FactionId, FactionState>;
    characters?: Record<CharacterId, CharacterState>;
    promises: PromiseRecord[];
    turn: number;
}

const moodOf = (support: number, radicalization: number): { label: string; tone: string } => {
    if (radicalization > 65) return { label: 'Mobilising', tone: 'danger' };
    if (support < 30) return { label: 'Hostile', tone: 'danger' };
    if (support < 45) return { label: 'Restive', tone: 'warn' };
    if (support > 68) return { label: 'Committed', tone: 'good' };
    return { label: 'Watchful', tone: 'neutral' };
};

/** A shape per tone so mood is legible without relying on colour alone. */
const MOOD_GLYPH: Record<string, string> = {
    good: '▲',
    warn: '!',
    danger: '▼',
    neutral: '•',
};

/**
 * Standing political pressure, always visible. Radicalisation is shown
 * separately from support because the dangerous combination is a faction that
 * has stopped supporting you but has not stopped being powerful.
 */
export function FactionRail({ factions, characters, promises, turn }: FactionRailProps) {
    if (!factions) return null;

    const activePromises = promises.filter(promise => promise.status === 'active');

    return (
        <aside className="faction-rail" aria-label="Political standing">
            <h3 className="rail-heading">The Room</h3>

            <ul className="rail-factions">
                {FACTIONS.map(faction => {
                    const state = factions[faction.id];
                    if (!state) return null;
                    const leader = CHARACTERS_BY_ID[faction.leaderId];
                    const mood = moodOf(state.support, state.radicalization);

                    return (
                        <li key={faction.id} className="rail-faction">
                            <div className="rail-faction-head">
                                <span className="rail-faction-name">{faction.shortName}</span>
                                <span className={`rail-mood tone-${mood.tone}`}>
                                    <span aria-hidden="true">{MOOD_GLYPH[mood.tone]}</span> {mood.label}
                                </span>
                            </div>

                            <div
                                className="rail-bar"
                                role="img"
                                aria-label={`${faction.shortName} support ${Math.round(state.support)} of 100`}
                            >
                                <span className="rail-bar-fill" style={{ width: `${state.support}%` }} />
                                <span
                                    className="rail-bar-power"
                                    style={{ left: `${state.power}%` }}
                                    title={`Power to act: ${Math.round(state.power)}`}
                                />
                            </div>

                            <div className="rail-faction-meta">
                                <span>{leader.name}</span>
                                {state.radicalization > 45 && (
                                    <span className="rail-radical">
                                        radicalised {Math.round(state.radicalization)}
                                    </span>
                                )}
                            </div>

                            {state.grievances.length > 0 && (
                                <p className="rail-grievance" title={state.grievances.join(' · ')}>
                                    {state.grievances[state.grievances.length - 1]}
                                </p>
                            )}
                        </li>
                    );
                })}
            </ul>

            {activePromises.length > 0 && (
                <>
                    <h3 className="rail-heading">Outstanding Promises</h3>
                    <ul className="rail-promises">
                        {activePromises.map(promise => {
                            const due = promise.deadlineTurn - turn;
                            return (
                                <li key={promise.id} className={due <= 1 ? 'is-urgent' : ''}>
                                    <span className="rail-promise-text">{promise.description}</span>
                                    <span className="rail-promise-due">
                                        {due <= 0 ? 'due now' : `${due} year${due === 1 ? '' : 's'}`}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </>
            )}

            {characters && (
                <>
                    <h3 className="rail-heading">Your Ministers</h3>
                    <ul className="rail-characters">
                        {Object.entries(characters).map(([id, state]) => {
                            const character = CHARACTERS_BY_ID[id as CharacterId];
                            if (!character) return null;
                            return (
                                <li key={id}>
                                    <span className="rail-character-name">{character.name}</span>
                                    <span className="rail-character-trust">
                                        trust {Math.round(state.trust)} · loyalty {Math.round(state.loyalty)}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </>
            )}
        </aside>
    );
}
