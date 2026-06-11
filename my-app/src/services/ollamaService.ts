import { BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOllama } from '@langchain/ollama';
import { ollamaConfig, OllamaConfig } from '../config/ollama';
import { createLogger } from './logger';
import {
    Audience,
    FeedbackGenerationResult,
    LearningSession,
    QuestionGenerationResult,
    UserAnswer,
} from '../types/session';
import { OllamaServiceError } from './ollamaErrors';
import {
    parseFeedbackGenerationResult,
    parseQuestionGenerationResult,
} from './ollamaParsers';
import { buildFeedbackPrompt, buildPrimePrompt, buildQuestionPrompt } from './prompts';

interface OllamaTag {
    name?: string;
    model?: string;
}

interface OllamaTagsResponse {
    models?: OllamaTag[];
}

export interface OllamaHealthStatus {
    ok: boolean;
    modelAvailable: boolean;
    message: string;
}

const logger = createLogger('ollamaService');

// Health checks should fail fast; the model-bearing chat calls get the full
// configured budget because a cold model load can take much longer.
const HEALTH_TIMEOUT_MS = 8000;

const isAbortError = (error: unknown): boolean => (
    error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')
);

export class OllamaService {
    private ollama: ChatOllama;
    private systemMessage: SystemMessage | null = null;

    constructor(private config: OllamaConfig = ollamaConfig) {
        this.ollama = new ChatOllama({
            baseUrl: config.baseUrl,
            model: config.model,
            temperature: config.temperature,
            cache: config.cache,
        });
    }

    /**
     * Runs a chat request with an abort-backed timeout so a wedged Ollama
     * surfaces a typed `timeout` error instead of hanging the UI forever.
     */
    private async invokeWithTimeout(
        messages: BaseMessage[],
        operation: string,
    ): Promise<string> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);
        const startedAt = Date.now();

        logger.info(`${operation}: requesting`, {
            model: this.config.model,
            timeoutMs: this.config.timeoutMs,
        });

        try {
            const response = await this.ollama.invoke(messages, { signal: controller.signal });
            logger.info(`${operation}: completed`, { elapsedMs: Date.now() - startedAt });
            return getResponseText(response.content);
        } catch (error) {
            if (isAbortError(error)) {
                logger.error(`${operation}: timed out`, {
                    elapsedMs: Date.now() - startedAt,
                    timeoutMs: this.config.timeoutMs,
                });
                throw new OllamaServiceError(
                    'timeout',
                    `Ollama did not respond within ${Math.round(this.config.timeoutMs / 1000)}s. `
                    + 'The model may still be loading, or the server may be stuck — check that '
                    + '`ollama serve` is healthy and try again.',
                );
            }

            logger.error(`${operation}: failed`, error);
            throw error;
        } finally {
            clearTimeout(timer);
        }
    }

    async checkHealth(): Promise<OllamaHealthStatus> {
        try {
            const response = await fetch(`${this.config.baseUrl}/api/tags`, {
                signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
            });

            if (!response.ok) {
                return {
                    ok: false,
                    modelAvailable: false,
                    message: `Ollama returned HTTP ${response.status}.`,
                };
            }

            const data = await response.json() as OllamaTagsResponse;
            const modelAvailable = (data.models || []).some((model) => (
                model.name === this.config.model ||
                model.model === this.config.model ||
                model.name?.startsWith(`${this.config.model}:`) ||
                model.model?.startsWith(`${this.config.model}:`)
            ));

            return {
                ok: modelAvailable,
                modelAvailable,
                message: modelAvailable
                    ? 'Ollama is ready.'
                    : `Model "${this.config.model}" is not available in Ollama.`,
            };
        } catch (error) {
            const timedOut = isAbortError(error);
            logger.warn(timedOut ? 'checkHealth: timed out' : 'checkHealth: unreachable', error);
            return {
                ok: false,
                modelAvailable: false,
                message: timedOut
                    ? `Ollama did not respond within ${Math.round(HEALTH_TIMEOUT_MS / 1000)}s. `
                        + 'Confirm that `ollama serve` is running and responsive.'
                    : 'Unable to reach Ollama. Confirm that `ollama serve` is running.',
            };
        }
    }

    async primeAudience(audience: Audience): Promise<void> {
        const health = await this.checkHealth();

        if (!health.ok) {
            throw new OllamaServiceError(
                health.message.includes('not available') ? 'model-missing' : 'ollama-unavailable',
                health.message,
            );
        }

        try {
            this.systemMessage = new SystemMessage(buildPrimePrompt(audience));
            await this.invokeWithTimeout([this.systemMessage], `primeAudience(${audience.id})`);
        } catch (error) {
            this.systemMessage = null;

            if (error instanceof OllamaServiceError) {
                throw error;
            }

            throw new OllamaServiceError('ollama-unavailable', 'Unable to prime Ollama for this audience.');
        }
    }

    async generateQuestions(
        audience: Audience,
        topic: string,
        explanation: string,
    ): Promise<QuestionGenerationResult> {
        if (!this.systemMessage) {
            this.systemMessage = new SystemMessage(buildPrimePrompt(audience));
        }

        try {
            const text = await this.invokeWithTimeout([
                this.systemMessage,
                new HumanMessage(buildQuestionPrompt(audience, topic, explanation)),
            ], 'generateQuestions');
            return parseQuestionGenerationResult(text);
        } catch (error) {
            if (error instanceof OllamaServiceError) {
                throw error;
            }

            throw new OllamaServiceError('invalid-response', 'Unable to generate structured questions.');
        }
    }

    async generateFeedback(session: LearningSession, answers: UserAnswer[]): Promise<FeedbackGenerationResult> {
        if (!session.audience) {
            throw new OllamaServiceError('unknown', 'Cannot generate feedback without an audience.');
        }

        if (!this.systemMessage) {
            this.systemMessage = new SystemMessage(buildPrimePrompt(session.audience));
        }

        try {
            const text = await this.invokeWithTimeout([
                this.systemMessage,
                new HumanMessage(buildFeedbackPrompt(session, answers)),
            ], 'generateFeedback');
            return parseFeedbackGenerationResult(text);
        } catch (error) {
            if (error instanceof OllamaServiceError) {
                throw error;
            }

            throw new OllamaServiceError('invalid-response', 'Unable to generate structured feedback.');
        }
    }

    isPrimed(): boolean {
        return this.systemMessage !== null;
    }
}

const getResponseText = (content: unknown): string => {
    if (typeof content === 'string') {
        return content;
    }

    if (Array.isArray(content)) {
        return content.map((item) => {
            if (typeof item === 'string') {
                return item;
            }

            if (item && typeof item === 'object' && 'text' in item) {
                return String(item.text);
            }

            return '';
        }).join('');
    }

    return String(content || '');
};

export const ollamaService = new OllamaService();
export { OllamaServiceError } from './ollamaErrors';
