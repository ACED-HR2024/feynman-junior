import type {
    Audience,
    FeedbackGenerationResult,
    LearningSession,
    QuestionGenerationResult,
    SessionErrorCode,
    UserAnswer,
} from '../types/session';
import type { OllamaConfig } from '../config/ollama';
import type { OllamaHealthStatus } from '../services/ollamaService';
import type { ModelPullProgress } from '../services/ollamaSetupService';
import type { SetupStatus } from '../services/setupStatus';

export const IPC_CHANNELS = {
    checkOllamaHealth: 'ollama:check-health',
    primeAudience: 'ollama:prime-audience',
    generateQuestions: 'ollama:generate-questions',
    generateFeedback: 'ollama:generate-feedback',
    getOllamaConfig: 'config:get-ollama',
    setOllamaConfig: 'config:set-ollama',
    getSetupStatus: 'setup:get-status',
    pullModel: 'setup:pull-model',
    cancelModelPull: 'setup:cancel-pull',
    modelPullProgress: 'setup:pull-progress',
} as const;

export interface IpcErrorPayload {
    name: string;
    message: string;
    code?: SessionErrorCode;
}

export type IpcResult<T> =
    | { ok: true; data: T }
    | { ok: false; error: IpcErrorPayload };

export interface QuestionGenerationPayload {
    audience: Audience;
    topic: string;
    explanation: string;
}

export interface FeedbackGenerationPayload {
    session: LearningSession;
    answers: UserAnswer[];
}

export interface FeynmanDesktopApi {
    ollama: {
        checkHealth: () => Promise<OllamaHealthStatus>;
        primeAudience: (audience: Audience) => Promise<void>;
        generateQuestions: (
            payload: QuestionGenerationPayload,
        ) => Promise<QuestionGenerationResult>;
        generateFeedback: (
            payload: FeedbackGenerationPayload,
        ) => Promise<FeedbackGenerationResult>;
    };
    config: {
        getOllamaConfig: () => Promise<OllamaConfig>;
        setOllamaConfig: (config: Partial<OllamaConfig>) => Promise<OllamaConfig>;
    };
    setup: {
        getStatus: () => Promise<SetupStatus>;
        pullModel: (model: string) => Promise<void>;
        cancelModelPull: () => Promise<void>;
        onModelPullProgress: (
            listener: (progress: ModelPullProgress) => void,
        ) => () => void;
    };
}
