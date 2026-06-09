import React, { useState } from 'react';
import { GeneratedQuestion, UserAnswer } from '../../types/session';

interface AnswerStageProps {
    questions: GeneratedQuestion[];
    initialAnswers?: UserAnswer[];
    onDraftChange?: (questionId: string, answer: string) => void;
    onSubmit: (answers: UserAnswer[]) => void;
    onBack: () => void;
}

const AnswerStage: React.FC<AnswerStageProps> = ({
    questions,
    initialAnswers = [],
    onDraftChange,
    onSubmit,
    onBack,
}) => {
    const [answers, setAnswers] = useState<Record<string, string>>(() => (
        initialAnswers.reduce<Record<string, string>>((drafts, item) => ({
            ...drafts,
            [item.questionId]: item.answer,
        }), {})
    ));

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
                    <span className="eyebrow">Step 4 · Answers</span>
                    <h1>Answer what the audience asked.</h1>
                    <p>
                        Empty answers are allowed and will be treated as skipped. Drafts
                        are preserved if you review the question list again.
                    </p>
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
                            onChange={(event) => {
                                const nextAnswer = event.target.value;

                                setAnswers((current) => ({
                                    ...current,
                                    [question.id]: nextAnswer,
                                }));
                                onDraftChange?.(question.id, nextAnswer);
                            }}
                            placeholder="Type your answer, or leave blank to skip this question."
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
