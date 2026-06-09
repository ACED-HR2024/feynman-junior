import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOllama } from '@langchain/ollama';
import { ollamaConfig, OllamaConfig } from '../config/ollama';
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

    async checkHealth(): Promise<OllamaHealthStatus> {
        try {
            const response = await fetch(`${this.config.baseUrl}/api/tags`);

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
            return {
                ok: false,
                modelAvailable: false,
                message: 'Unable to reach Ollama. Confirm that `ollama serve` is running.',
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
            await this.ollama.invoke([this.systemMessage]);
        } catch (error) {
            this.systemMessage = null;
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
            const response = await this.ollama.invoke([
                this.systemMessage,
                new HumanMessage(buildQuestionPrompt(audience, topic, explanation)),
            ]);
            return parseQuestionGenerationResult(getResponseText(response.content));
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
            const response = await this.ollama.invoke([
                this.systemMessage,
                new HumanMessage(buildFeedbackPrompt(session, answers)),
            ]);
            return parseFeedbackGenerationResult(getResponseText(response.content));
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
