export type AudienceId =
    | 'elementary'
    | 'middle'
    | 'high'
    | 'undergraduate'
    | 'graduate'
    | 'professionals';

export type WorkflowStage =
    | 'selectAudience'
    | 'primePersona'
    | 'submitExplanation'
    | 'generateQuestions'
    | 'reviewQuestions'
    | 'answerQuestions'
    | 'generateFeedback'
    | 'reviewFeedback'
    | 'error';

export interface Audience {
    id: AudienceId;
    label: string;
    description: string;
    promptGuidance: string;
}

export interface GeneratedQuestion {
    id: string;
    prompt: string;
    reason?: string;
}

export interface UserAnswer {
    questionId: string;
    answer: string;
}

export interface SessionFeedback {
    clarity: string;
    strengths: string[];
    missingConcepts: string[];
    simplificationTips: string[];
    nextSteps: string[];
}

export type SessionErrorCode =
    | 'ollama-unavailable'
    | 'model-missing'
    | 'invalid-response'
    | 'speech-unsupported'
    | 'speech-permission'
    | 'unknown';

export interface SessionError {
    code: SessionErrorCode;
    title: string;
    message: string;
    recoverable: boolean;
}

export interface LearningSession {
    audience: Audience | null;
    topic: string;
    explanation: string;
    questions: GeneratedQuestion[];
    answers: UserAnswer[];
    feedback: SessionFeedback | null;
    stage: WorkflowStage;
    isLoading: boolean;
    error: SessionError | null;
}

export interface QuestionGenerationResult {
    questions: GeneratedQuestion[];
    nextSteps: string[];
}

export interface FeedbackGenerationResult {
    feedback: SessionFeedback;
}
