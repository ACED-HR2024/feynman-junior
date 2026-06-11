import React, { useState } from 'react';
import AudioAnswerRecorder from '../input/AudioAnswerRecorder';
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

    const updateAnswer = (questionId: string, answer: string) => {
        setAnswers((current) => ({
            ...current,
            [questionId]: answer,
        }));
        onDraftChange?.(questionId, answer);
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
                {questions.map((question, index) => {
                    const answerId = `answer-${question.id}`;

                    return (
                    <div className="answer-card" key={question.id}>
                        <span className="eyebrow">Question {index + 1}</span>
                        <label htmlFor={answerId}>
                            <strong>{question.prompt}</strong>
                        </label>
                        <textarea
                            id={answerId}
                            value={answers[question.id] || ''}
                            onChange={(event) => updateAnswer(question.id, event.target.value)}
                            placeholder="Type your answer, record a verbal answer, or leave blank to skip this question."
                            rows={4}
                        />
                        <AudioAnswerRecorder
                            onTranscriptReady={(transcript) => updateAnswer(question.id, transcript)}
                        />
                    </div>
                );})}

                <button type="submit" className="primary-button">
                    Get Feedback
                </button>
            </form>
        </section>
    );
};

export default AnswerStage;
