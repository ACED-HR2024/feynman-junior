import React from 'react';
import { GeneratedQuestion } from '../../types/session';

interface QuestionStageProps {
    questions: GeneratedQuestion[];
    onContinue: () => void;
    onReset: () => void;
}

const QuestionStage: React.FC<QuestionStageProps> = ({ questions, onContinue, onReset }) => (
    <section className="stage-card wide">
        <div className="stage-header">
            <div>
                <h1>Audience Questions</h1>
                <p>Use these questions to test whether your explanation is clear.</p>
            </div>
            <button type="button" className="secondary-button" onClick={onReset}>
                Start Over
            </button>
        </div>

        <div className="question-grid">
            {questions.map((question, index) => (
                <article className="question-card" key={question.id}>
                    <span className="eyebrow">Question {index + 1}</span>
                    <h2>{question.prompt}</h2>
                    {question.reason && <p>{question.reason}</p>}
                </article>
            ))}
        </div>

        <button type="button" className="primary-button" onClick={onContinue}>
            Answer Questions
        </button>
    </section>
);

export default QuestionStage;
