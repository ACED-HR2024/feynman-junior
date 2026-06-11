import React from 'react';
import { GeneratedQuestion } from '../../types/session';

interface QuestionStageProps {
    questions: GeneratedQuestion[];
    onContinue: () => void;
    onRevise: () => void;
    onReset: () => void;
}

const QuestionStage: React.FC<QuestionStageProps> = ({
    questions,
    onContinue,
    onRevise,
    onReset,
}) => (
    <section className="stage-card wide">
        <div className="stage-header">
            <div>
                <span className="eyebrow">Step 3 · Questions</span>
                <h1>Review the audience questions.</h1>
                <p>
                    These questions are the learning task. If they reveal a gap in your
                    explanation, revise before answering.
                </p>
            </div>
            <div className="button-row">
                <button type="button" className="secondary-button" onClick={onRevise}>
                    Revise Explanation
                </button>
                <button type="button" className="secondary-button" onClick={onReset}>
                    Start Over
                </button>
            </div>
        </div>

        <div className="question-grid">
            {questions.map((question, index) => (
                <article className="question-card" key={question.id}>
                    <span className="eyebrow">Question {index + 1}</span>
                    <h2>{question.prompt}</h2>
                    {question.reason && (
                        <p>
                            <strong>What this tests:</strong> {question.reason}
                        </p>
                    )}
                    <button
                        type="button"
                        className="text-button"
                        onClick={() => {
                            void navigator.clipboard?.writeText(question.prompt);
                        }}
                    >
                        Copy question
                    </button>
                </article>
            ))}
        </div>

        <button type="button" className="primary-button" onClick={onContinue}>
            Answer Questions
        </button>
    </section>
);

export default QuestionStage;
