import React, { useState } from 'react';
import { GeneratedQuestion, UserAnswer } from '../../types/session';

interface AnswerStageProps {
    questions: GeneratedQuestion[];
    onSubmit: (answers: UserAnswer[]) => void;
    onBack: () => void;
}

const AnswerStage: React.FC<AnswerStageProps> = ({ questions, onSubmit, onBack }) => {
    const [answers, setAnswers] = useState<Record<string, string>>({});

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSubmit(questions.map((question) => ({
            questionId: question.id,
            answer: answers[question.id]?.trim() || '',
        })));
    };

    return (
        <section className="stage-card wide">
            <div className="stage-header">
                <div>
                    <h1>Answer The Questions</h1>
                    <p>Respond as the learner, then Feynman Junior will review the session.</p>
                </div>
                <button type="button" className="secondary-button" onClick={onBack}>
                    Review Questions
                </button>
            </div>

            <form className="answer-list" onSubmit={handleSubmit}>
                {questions.map((question, index) => (
                    <label className="answer-card" key={question.id}>
                        <span className="eyebrow">Question {index + 1}</span>
                        <strong>{question.prompt}</strong>
                        <textarea
                            value={answers[question.id] || ''}
                            onChange={(event) => setAnswers((current) => ({
                                ...current,
                                [question.id]: event.target.value,
                            }))}
                            placeholder="Type your answer..."
                            rows={4}
                        />
                    </label>
                ))}

                <button type="submit" className="primary-button">
                    Get Feedback
                </button>
            </form>
        </section>
    );
};

export default AnswerStage;
