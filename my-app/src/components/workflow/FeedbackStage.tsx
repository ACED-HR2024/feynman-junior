import React from 'react';
import { LearningSession } from '../../types/session';

interface FeedbackStageProps {
    session: LearningSession;
    onRevise: () => void;
    onReset: () => void;
    onChangeAudience: () => void;
}

const FeedbackList: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
    <section className="feedback-section">
        <h2>{title}</h2>
        {items.length ? (
            <ul>
                {items.map((item) => <li key={item}>{item}</li>)}
            </ul>
        ) : (
            <p>No specific notes returned.</p>
        )}
    </section>
);

const FeedbackStage: React.FC<FeedbackStageProps> = ({
    session,
    onRevise,
    onReset,
    onChangeAudience,
}) => {
    if (!session.feedback) {
        return null;
    }

    return (
        <section className="stage-card wide">
            <div className="stage-header">
                <div>
                    <span className="eyebrow">Step 5 · Feedback</span>
                    <h1>{session.topic || 'Feynman Practice Session'}</h1>
                    <p>{session.feedback.clarity}</p>
                </div>
                <div className="button-row">
                    <button type="button" className="secondary-button" onClick={onChangeAudience}>
                        Change Audience
                    </button>
                    <button type="button" className="primary-button" onClick={onRevise}>
                        Revise Explanation
                    </button>
                    <button type="button" className="secondary-button" onClick={onReset}>
                        Start New Session
                    </button>
                </div>
            </div>

            <div className="reflection-panel">
                <div>
                    <span className="panel-label">Original explanation</span>
                    <p>{session.explanation}</p>
                </div>
                <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                        const markdown = [
                            `# ${session.topic || 'Feynman Practice Session'}`,
                            '',
                            `Audience: ${session.audience?.label || 'Not selected'}`,
                            '',
                            '## Overall clarity',
                            session.feedback?.clarity || '',
                            '',
                            '## Strengths',
                            ...(session.feedback?.strengths.map((item) => `- ${item}`) || []),
                            '',
                            '## Missing concepts',
                            ...(session.feedback?.missingConcepts.map((item) => `- ${item}`) || []),
                            '',
                            '## Simplification tips',
                            ...(session.feedback?.simplificationTips.map((item) => `- ${item}`) || []),
                        ].join('\n');

                        void navigator.clipboard?.writeText(markdown);
                    }}
                >
                    Copy Feedback
                </button>
            </div>

            <div className="feedback-grid">
                <FeedbackList title="Strengths" items={session.feedback.strengths} />
                <FeedbackList title="Missing Concepts" items={session.feedback.missingConcepts} />
                <FeedbackList title="Simplification Tips" items={session.feedback.simplificationTips} />
                <FeedbackList title="Next Steps" items={session.feedback.nextSteps} />
            </div>
        </section>
    );
};

export default FeedbackStage;
