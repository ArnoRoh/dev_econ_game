import './TurnPrimer.css';

interface TurnPrimerProps {
    onDismiss: () => void;
}

/**
 * Shown once, on the first cabinet session. The action economy and the
 * deliberate absence of numbers before a decision are both unusual enough that
 * a player who is not told will read them as bugs.
 */
export function TurnPrimer({ onDismiss }: TurnPrimerProps) {
    return (
        <aside className="primer" aria-label="How a cabinet session works">
            <div className="primer-body">
                <h3 className="primer-title">How this works</h3>
                <ul className="primer-list">
                    <li>
                        <strong>More reaches the table than you can take.</strong> Three or four matters,
                        two actions. Whatever you leave resolves without you, and whoever raised it notices.
                    </li>
                    <li>
                        <strong>Reading a dossier is free.</strong> Only committing to an option spends an
                        action, so open everything before you choose.
                    </li>
                    <li>
                        <strong>You will not be shown the numbers first.</strong> Your ministers give you
                        forecasts, not figures — and they are not always right. The measured effects appear
                        in the debrief once the decision is made.
                    </li>
                    <li>
                        <strong>Consequences arrive late.</strong> Much of what you decide this year will
                        not show up until the 1970s, in the newspaper, named against the choice that caused it.
                    </li>
                </ul>
                <p className="primer-keys">
                    Enter advances · Esc goes back · number keys open a proposal
                </p>
            </div>
            <button type="button" className="primer-dismiss" onClick={onDismiss}>
                Understood
            </button>
        </aside>
    );
}
