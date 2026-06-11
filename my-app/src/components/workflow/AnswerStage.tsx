import React, { useState } from 'react';
import VoiceRecorder from '../input/VoiceRecorder';
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

    const appendTranscript = (questionId: string, transcript: string) => {
        const current = answers[questionId]?.trim() || '';
        updateAnswer(questionId, current ? `${current} ${transcript}` : transcript);
    };

    return (
        <section className="stage-card wide">
            <div className="stage-header">
                <div>
                    <span className="eyebrow">Step 4 · Answers</span>
                    <h1>Answer what the audience asked — out loud.</h1>
                    <p>
                        Record a spoken answer for each question, then fix anything the
                        transcription missed. Empty answers are treated as skipped, and
                        drafts survive going back to the question list.
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
                            <VoiceRecorder
                                label="Record Answer"
                                idleHint="Speak your answer, then review the transcript below."
                                onTranscript={(transcript) => appendTranscript(question.id, transcript)}
                            />
                            <textarea
                                id={answerId}
                                value={answers[question.id] || ''}
                                onChange={(event) => updateAnswer(question.id, event.target.value)}
                                placeholder="Your spoken answer appears here. Edit it, or leave blank to skip this question."
                                rows={4}
                            />
                        </div>
                    );
                })}

                <button type="submit" className="primary-button">
                    Get Feedback
                </button>
            </form>
        </section>
    );
};

export default AnswerStage;
