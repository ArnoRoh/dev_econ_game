import { useEffect, useState } from 'react';
import type { KnowledgeCheck } from '../engine/types';
import './KnowledgeCheckModal.css';

interface KnowledgeCheckModalProps {
    check: KnowledgeCheck;
    onAnswer: (answerId: string) => void;
    onClose: () => void;
}

/**
 * Offered only after a concept has been met twice in play, and never during a
 * decision. A wrong answer costs nothing and buys the explanation; a right one
 * earns an Advisor Insight token. The asymmetry is deliberate — this should
 * feel like a reward for paying attention, not an exam.
 */
export function KnowledgeCheckModal({ check, onAnswer, onClose }: KnowledgeCheckModalProps) {
    const [chosen, setChosen] = useState<string | null>(null);
    const answered = chosen !== null;
    const correct = chosen === check.correctAnswerId;

    // Escape always dismisses, whether or not the question has been answered.
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const choose = (answerId: string) => {
        if (answered) return;
        setChosen(answerId);
        onAnswer(answerId);
    };

    return (
        <div className="modal-overlay">
            <div className="knowledge-modal" role="dialog" aria-modal="true" aria-label="Knowledge check">
                <p className="knowledge-kicker">A question from your economic adviser</p>
                <h2 className="knowledge-prompt">{check.prompt}</h2>

                <ul className="knowledge-answers">
                    {check.answers.map(answer => {
                        const isChosen = chosen === answer.id;
                        const isRight = answer.id === check.correctAnswerId;
                        const state = !answered
                            ? ''
                            : isRight
                              ? ' is-correct'
                              : isChosen
                                ? ' is-wrong'
                                : ' is-dimmed';

                        return (
                            <li key={answer.id}>
                                <button
                                    type="button"
                                    className={`knowledge-answer${state}`}
                                    onClick={() => choose(answer.id)}
                                    disabled={answered}
                                >
                                    {answer.text}
                                    {answered && isRight && <span className="knowledge-tick"> ✓</span>}
                                </button>
                            </li>
                        );
                    })}
                </ul>

                {answered && (
                    <div className={`knowledge-result${correct ? ' is-correct' : ''}`}>
                        <h3 className="knowledge-verdict">
                            {correct ? 'Correct — one Advisor Insight earned' : 'Not quite'}
                        </h3>
                        <p className="knowledge-explanation">{check.explanation}</p>
                        <button type="button" className="primary-button" onClick={onClose} autoFocus>
                            Continue
                        </button>
                    </div>
                )}

                {!answered && (
                    <button
                        type="button"
                        className="knowledge-skip"
                        onClick={onClose}
                        title="Press Escape to skip"
                    >
                        Skip this
                    </button>
                )}
            </div>
        </div>
    );
}
