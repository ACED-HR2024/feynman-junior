import {
    FeedbackGenerationResult,
    GeneratedQuestion,
    QuestionGenerationResult,
    SessionFeedback,
} from '../types/session';
import { OllamaServiceError } from './ollamaErrors';

const parseJsonObject = (raw: string): unknown => {
    const trimmed = raw.trim();
    const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const jsonText = fencedMatch?.[1] || trimmed;
    const start = jsonText.indexOf('{');
    const end = jsonText.lastIndexOf('}');

    if (start === -1 || end === -1 || end <= start) {
        throw new OllamaServiceError('invalid-response', 'Ollama did not return a JSON object.');
    }

    try {
        return JSON.parse(jsonText.slice(start, end + 1));
    } catch (error) {
        throw new OllamaServiceError('invalid-response', 'Ollama returned malformed JSON.');
    }
};

export const parseQuestionGenerationResult = (raw: string): QuestionGenerationResult => {
    const parsed = parseJsonObject(raw) as Partial<QuestionGenerationResult>;
    const questions = Array.isArray(parsed.questions) ? parsed.questions : [];

    if (questions.length === 0) {
        throw new OllamaServiceError('invalid-response', 'Ollama response did not include questions.');
    }

    const parsedQuestions = questions.map((question, index) => {
        const candidate = question as Partial<GeneratedQuestion>;
        return {
            id: candidate.id || `question-${index + 1}`,
            prompt: String(candidate.prompt || ''),
            reason: candidate.reason ? String(candidate.reason) : undefined,
        };
    }).filter((question) => question.prompt.trim().length > 0);

    if (parsedQuestions.length === 0) {
        throw new OllamaServiceError('invalid-response', 'Ollama response did not include valid questions.');
    }

    return {
        questions: parsedQuestions,
        nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps.map(String) : [],
    };
};

export const parseFeedbackGenerationResult = (raw: string): FeedbackGenerationResult => {
    const parsed = parseJsonObject(raw) as { feedback?: Partial<SessionFeedback> };
    const feedback = parsed.feedback;

    if (!feedback) {
        throw new OllamaServiceError('invalid-response', 'Ollama response did not include feedback.');
    }

    return {
        feedback: {
            clarity: String(feedback.clarity || ''),
            strengths: Array.isArray(feedback.strengths) ? feedback.strengths.map(String) : [],
            missingConcepts: Array.isArray(feedback.missingConcepts) ? feedback.missingConcepts.map(String) : [],
            simplificationTips: Array.isArray(feedback.simplificationTips) ? feedback.simplificationTips.map(String) : [],
            nextSteps: Array.isArray(feedback.nextSteps) ? feedback.nextSteps.map(String) : [],
        },
    };
};
