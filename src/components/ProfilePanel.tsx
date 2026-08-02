import type { MetaProfile } from '../metaProgression';
import { nextUnlock } from '../metaProgression';
import { UNLOCKS } from '../data/unlocks';
import { allAdvisorRecords, accuracyOf, advisorReading } from '../engine/calibrationLogic';
import type { GameState } from '../engine/types';
import './ProfilePanel.css';

interface Props {
    profile: MetaProfile;
    /** Memory earned by the run that just ended. */
    earned: number;
    /** Unlock ids crossed by that run, highlighted. */
    fresh: string[];
    /** The finished run, for its advisor record. */
    state: GameState;
}

/**
 * What the run just ended leaves behind.
 *
 * Shown after the ending, deliberately, and framed as the state learning rather
 * than the player being rewarded: a campaign that collapses in 1974 still
 * teaches the civil service something, and the panel says so. Making a failed
 * run visibly productive is the thing that turns a loss into another attempt
 * instead of a reason to stop.
 */
export function ProfilePanel({ profile, earned, fresh, state }: Props) {
    const upcoming = nextUnlock(profile.institutionalMemory);
    const ratio = upcoming ? Math.min(1, profile.institutionalMemory / upcoming.threshold) : 1;
    const advisors = allAdvisorRecords(state).filter(entry => entry.record.judged > 0);

    return (
        <section className="profile-panel" aria-label="Institutional memory">
            <header className="profile-panel__head">
                <h2>What the Republic Learned</h2>
                <p className="profile-panel__earned">
                    <strong>+{earned}</strong> institutional memory from this run
                    <span> · {profile.institutionalMemory} total across {profile.runs} {profile.runs === 1 ? 'attempt' : 'attempts'}</span>
                </p>
            </header>

            {fresh.length > 0 && (
                <div className="profile-unlocked">
                    <h3>Unlocked</h3>
                    <ul>
                        {fresh.map(id => {
                            const unlock = UNLOCKS.find(entry => entry.id === id);
                            if (!unlock) return null;
                            return (
                                <li key={id}>
                                    <strong>{unlock.name}</strong>
                                    <p>{unlock.description}</p>
                                    <em>{unlock.flavour}</em>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {upcoming && (
                <div className="profile-next">
                    <div className="profile-next__bar">
                        <div className="profile-next__fill" style={{ width: `${ratio * 100}%` }} />
                    </div>
                    <p>
                        Next: <strong>{upcoming.name}</strong> — {upcoming.description}
                        <span className="profile-next__gap">
                            {' '}({upcoming.threshold - profile.institutionalMemory} to go)
                        </span>
                    </p>
                </div>
            )}

            {advisors.length > 0 && (
                <div className="profile-advisors">
                    <h3>The Cabinet Record</h3>
                    <p className="profile-advisors__note">
                        How this government's advisers performed, judged against what actually happened.
                    </p>
                    <ul>
                        {advisors.map(({ id, name, title, record }) => {
                            const accuracy = accuracyOf(record);
                            return (
                                <li key={id}>
                                    <div className="profile-advisor__head">
                                        <strong>{name}</strong>
                                        <span className="profile-advisor__title">{title}</span>
                                        {accuracy !== null && (
                                            <span className="profile-advisor__score">
                                                {Math.round(accuracy * 100)}% over {record.judged}
                                            </span>
                                        )}
                                    </div>
                                    <p>{advisorReading(record)}</p>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </section>
    );
}
