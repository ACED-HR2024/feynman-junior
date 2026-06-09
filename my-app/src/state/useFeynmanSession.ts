import { useCallback, useState } from 'react';
import { ollamaService, OllamaServiceError } from '../services/ollamaService';
import { getAudienceById } from '../services/prompts';
import {
    AudienceId,
    LearningSession,
    SessionError,
    UserAnswer,
} from '../types/session';

const initialSession: LearningSession = {
    audience: null,
    topic: '',
    explanation: '',
    questions: [],
    answers: [],
    feedback: null,
    stage: 'selectAudience',
    isLoading: false,
    error: null,
};

const toSessionError = (error: unknown): SessionError => {
    if (error instanceof OllamaServiceError) {
        if (error.code === 'model-missing') {
            return {
                code: error.code,
                title: 'Ollama model missing',
                message: error.message,
                recoverable: true,
            };
        }

        if (error.code === 'ollama-unavailable') {
            return {
                code: error.code,
                title: 'Ollama is unavailable',
                message: error.message,
                recoverable: true,
            };
        }

        if (error.code === 'invalid-response') {
            return {
                code: error.code,
                title: 'Unexpected model response',
                message: error.message,
                recoverable: true,
            };
        }
    }

    return {
        code: 'unknown',
        title: 'Something went wrong',
        message: error instanceof Error ? error.message : 'An unknown error occurred.',
        recoverable: true,
    };
};

export const useFeynmanSession = () => {
    const [session, setSession] = useState<LearningSession>(initialSession);

    const selectAudience = useCallback(async (audienceId: AudienceId) => {
        const audience = getAudienceById(audienceId);

        setSession({
            ...initialSession,
            audience,
            stage: 'primePersona',
            isLoading: true,
        });

        try {
            await ollamaService.primeAudience(audience);
            setSession((current) => ({
                ...current,
                stage: 'submitExplanation',
                isLoading: false,
                error: null,
            }));
        } catch (error) {
            setSession((current) => ({
                ...current,
                stage: 'error',
                isLoading: false,
                error: toSessionError(error),
            }));
        }
    }, []);

    const submitExplanation = useCallback(async (topic: string, explanation: string) => {
        if (!session.audience) {
            setSession((current) => ({
                ...current,
                stage: 'error',
                error: {
                    code: 'unknown',
                    title: 'Audience required',
                    message: 'Select an audience before submitting an explanation.',
                    recoverable: true,
                },
            }));
            return;
        }

        setSession((current) => ({
            ...current,
            topic,
            explanation,
            questions: [],
            answers: [],
            feedback: null,
            stage: 'generateQuestions',
            isLoading: true,
            error: null,
        }));

        try {
            const result = await ollamaService.generateQuestions(session.audience, topic, explanation);
            setSession((current) => ({
                ...current,
                questions: result.questions,
                stage: 'reviewQuestions',
                isLoading: false,
            }));
        } catch (error) {
            setSession((current) => ({
                ...current,
                stage: 'error',
                isLoading: false,
                error: toSessionError(error),
            }));
        }
    }, [session.audience]);

    const submitAnswers = useCallback(async (answers: UserAnswer[]) => {
        setSession((current) => ({
            ...current,
            answers,
            feedback: null,
            stage: 'generateFeedback',
            isLoading: true,
            error: null,
        }));

        try {
            const result = await ollamaService.generateFeedback(session, answers);
            setSession((current) => ({
                ...current,
                feedback: result.feedback,
                stage: 'reviewFeedback',
                isLoading: false,
            }));
        } catch (error) {
            setSession((current) => ({
                ...current,
                stage: 'error',
                isLoading: false,
                error: toSessionError(error),
            }));
        }
    }, [session]);

    const continueToAnswers = useCallback(() => {
        setSession((current) => ({
            ...current,
            stage: 'answerQuestions',
        }));
    }, []);

    const reviewQuestions = useCallback(() => {
        setSession((current) => ({
            ...current,
            stage: 'reviewQuestions',
        }));
    }, []);

    const resetSession = useCallback(() => {
        setSession(initialSession);
    }, []);

    const changeAudience = useCallback(() => {
        setSession({
            ...initialSession,
            stage: 'selectAudience',
        });
    }, []);

    const retry = useCallback(() => {
        if (session.audience && session.explanation) {
            void submitExplanation(session.topic, session.explanation);
            return;
        }

        if (session.audience) {
            void selectAudience(session.audience.id);
            return;
        }

        resetSession();
    }, [resetSession, selectAudience, session.audience, session.explanation, session.topic, submitExplanation]);

    return {
        session,
        selectAudience,
        submitExplanation,
        continueToAnswers,
        reviewQuestions,
        submitAnswers,
        resetSession,
        changeAudience,
        retry,
    };
};
