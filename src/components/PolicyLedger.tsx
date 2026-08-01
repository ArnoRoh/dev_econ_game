import type { ForecastAudit, NewspaperItem, PolicyDecisionRecord, PromiseRecord } from '../engine/types';
import { CHARACTERS_BY_ID } from '../data/characters';
import { formatEffectList } from '../effectFormatting';
import './PolicyLedger.css';

interface PolicyLedgerProps {
    decisions: PolicyDecisionRecord[];
    newspaper: NewspaperItem[];
    promises: PromiseRecord[];
    audits: ForecastAudit[];
    onClose: () => void;
}

const STATUS_LABEL: Record<PolicyDecisionRecord['status'], string> = {
    chosen: 'Acted',
    ignored: 'Ignored',
    rejected: 'Declined',
    reversed: 'Reversed',
};

/**
 * The complete record. A player should be able to finish a run and reconstruct
 * exactly what they did, what they refused, what they never got to, and which
 * of those came back.
 */
export function PolicyLedger({ decisions, newspaper, promises, audits, onClose }: PolicyLedgerProps) {
    const consequencesFor = (decisionId: string) =>
        newspaper.filter(item => item.sourceDecisionId === decisionId);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="ledger"
                role="dialog"
                aria-modal="true"
                aria-label="Policy archive"
                onClick={event => event.stopPropagation()}
            >
                <header className="ledger-header">
                    <h2 className="ledger-title">Policy Archive</h2>
                    <button type="button" className="ledger-close" onClick={onClose} aria-label="Close archive">
                        ×
                    </button>
                </header>

                {promises.length > 0 && (
                    <section className="ledger-section">
                        <h3 className="ledger-section-title">Promises</h3>
                        <ul className="ledger-promises">
                            {promises.map(promise => (
                                <li key={promise.id} className={`is-${promise.status}`}>
                                    <span className="ledger-promise-status">{promise.status}</span>
                                    <span>{promise.description}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <section className="ledger-section">
                    <h3 className="ledger-section-title">Decisions ({decisions.length})</h3>

                    {decisions.length === 0 && (
                        <p className="ledger-empty">Nothing recorded yet.</p>
                    )}

                    <ol className="ledger-list">
                        {decisions
                            .slice()
                            .reverse()
                            .map(decision => {
                                const sponsor = CHARACTERS_BY_ID[decision.sponsorId];
                                const consequences = consequencesFor(decision.id);
                                const relevantAudits = audits.filter(
                                    audit => audit.decisionId === decision.id && audit.verdict,
                                );

                                return (
                                    <li key={decision.id} className={`ledger-entry status-${decision.status}`}>
                                        <div className="ledger-entry-head">
                                            <span className="ledger-year">{decision.year}</span>
                                            <span className="ledger-entry-title">{decision.proposalTitle}</span>
                                            <span className="ledger-status">{STATUS_LABEL[decision.status]}</span>
                                        </div>

                                        {decision.optionText && (
                                            <p className="ledger-option">{decision.optionText}</p>
                                        )}
                                        <p className="ledger-sponsor">Raised by {sponsor?.name ?? 'the cabinet'}</p>

                                        {(Object.keys(decision.immediateEffects).length > 0 ||
                                            decision.treasuryEffect) && (
                                            <ul className="ledger-effects">
                                                {formatEffectList(
                                                    decision.immediateEffects,
                                                    decision.treasuryEffect,
                                                ).map(effect => (
                                                    <li
                                                        key={effect.label}
                                                        className={effect.positive ? 'is-good' : 'is-bad'}
                                                    >
                                                        {effect.label}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        {relevantAudits.length > 0 && (
                                            <div className="ledger-audits">
                                                <span className="ledger-sub-label">Forecast record</span>
                                                {relevantAudits.map(audit => (
                                                    <span
                                                        key={`${audit.advisorId}-${audit.summary}`}
                                                        className={`ledger-audit is-${audit.verdict}`}
                                                    >
                                                        {CHARACTERS_BY_ID[audit.advisorId]?.name}: {audit.verdict}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {consequences.length > 0 && (
                                            <div className="ledger-consequences">
                                                <span className="ledger-sub-label">What followed</span>
                                                <ul>
                                                    {consequences.map(item => (
                                                        <li key={item.id} className={`tone-${item.tone}`}>
                                                            <strong>{item.year}</strong> — {item.headline}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {decision.status === 'ignored' && consequences.length === 0 && (
                                            <p className="ledger-pending">
                                                Left unattended. The consequence has not arrived yet.
                                            </p>
                                        )}
                                    </li>
                                );
                            })}
                    </ol>
                </section>
            </div>
        </div>
    );
}
