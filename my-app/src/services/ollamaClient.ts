import {
    Audience,
    FeedbackGenerationResult,
    LearningSession,
    QuestionGenerationResult,
    SessionErrorCode,
    UserAnswer,
} from '../types/session';
import { ollamaService as browserOllamaService, OllamaServiceError } from './ollamaService';

const toOllamaError = (error: unknown, fallbackMessage: string): OllamaServiceError => {
    if (error instanceof OllamaServiceError) {
        return error;
    }

    const candidate = error as { code?: SessionErrorCode; message?: string };

    return new OllamaServiceError(
        candidate?.code || 'unknown',
        candidate?.message || fallbackMessage,
    );
};

export const ollamaClient = {
    checkHealth: async () => {
        if (window.feynman) {
            return window.feynman.ollama.checkHealth();
        }

        return browserOllamaService.checkHealth();
    },

    primeAudience: async (audience: Audience): Promise<void> => {
        try {
            if (window.feynman) {
                await window.feynman.ollama.primeAudience(audience);
                return;
            }

            await browserOllamaService.primeAudience(audience);
        } catch (error) {
            throw toOllamaError(error, 'Unable to prime Ollama for this audience.');
        }
    },

    generateQuestions: async (
        audience: Audience,
        topic: string,
        explanation: string,
    ): Promise<QuestionGenerationResult> => {
        try {
            if (window.feynman) {
                return window.feynman.ollama.generateQuestions({
                    audience,
                    topic,
                    explanation,
                });
            }

            return browserOllamaService.generateQuestions(audience, topic, explanation);
        } catch (error) {
            throw toOllamaError(error, 'Unable to generate structured questions.');
        }
    },

    generateFeedback: async (
        session: LearningSession,
        answers: UserAnswer[],
    ): Promise<FeedbackGenerationResult> => {
        try {
            if (window.feynman) {
                return window.feynman.ollama.generateFeedback({
                    session,
                    answers,
                });
            }

            return browserOllamaService.generateFeedback(session, answers);
        } catch (error) {
            throw toOllamaError(error, 'Unable to generate structured feedback.');
        }
    },
};

export { OllamaServiceError };
