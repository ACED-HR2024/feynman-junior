import { afterEach, describe, expect, it, vi } from 'vitest';
import { FeynmanDesktopApi } from '../desktop/api';
import { Audience } from '../types/session';
import { ollamaClient, OllamaServiceError } from './ollamaClient';

const audience: Audience = {
    id: 'middle',
    label: 'Middle school kids',
    description: 'Students ready for basic abstractions.',
    promptGuidance: 'Use plain language.',
};

const createDesktopApi = (overrides: {
    ollama?: Partial<FeynmanDesktopApi['ollama']>;
} = {}): FeynmanDesktopApi => ({
    ollama: {
        checkHealth: vi.fn(),
        primeAudience: vi.fn(),
        generateQuestions: vi.fn(),
        generateFeedback: vi.fn(),
        ...overrides.ollama,
    },
    config: {
        getOllamaConfig: vi.fn(),
        setOllamaConfig: vi.fn(),
        getTranscriptionConfig: vi.fn(),
        setTranscriptionConfig: vi.fn(),
    },
    transcription: {
        transcribeAudio: vi.fn(),
    },
    setup: {
        getStatus: vi.fn(),
        pullModel: vi.fn(),
        cancelModelPull: vi.fn(),
        onModelPullProgress: vi.fn(),
    },
});

const setDesktopApi = (api: FeynmanDesktopApi | undefined) => {
    Object.defineProperty(window, 'feynman', {
        configurable: true,
        writable: true,
        value: api,
    });
};

describe('ollamaClient', () => {
    afterEach(() => {
        setDesktopApi(undefined);
        vi.restoreAllMocks();
    });

    it('delegates question generation to the Electron desktop API when available', async () => {
        const generateQuestions = vi.fn().mockResolvedValue({
            questions: [{ id: 'question-1', prompt: 'Why?' }],
            nextSteps: [],
        });

        setDesktopApi(createDesktopApi({ ollama: { generateQuestions } }));

        const result = await ollamaClient.generateQuestions(
            audience,
            'Gravity',
            'Gravity pulls objects together.',
        );

        expect(generateQuestions).toHaveBeenCalledWith({
            audience,
            topic: 'Gravity',
            explanation: 'Gravity pulls objects together.',
        });
        expect(result.questions[0].prompt).toBe('Why?');
    });

    it('preserves typed Ollama error codes from the desktop bridge', async () => {
        setDesktopApi(createDesktopApi({
            ollama: {
                primeAudience: vi.fn().mockRejectedValue(Object.assign(
                    new Error('Missing model'),
                    { code: 'model-missing' },
                )),
            },
        }));

        await expect(ollamaClient.primeAudience(audience)).rejects.toMatchObject({
            code: 'model-missing',
        } satisfies Partial<OllamaServiceError>);
    });
});
