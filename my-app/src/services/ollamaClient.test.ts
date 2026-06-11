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

        setDesktopApi({
            ollama: {
                checkHealth: vi.fn(),
                primeAudience: vi.fn(),
                generateQuestions,
                generateFeedback: vi.fn(),
            },
            config: {
                getOllamaConfig: vi.fn(),
                setOllamaConfig: vi.fn(),
            },
            transcription: {
                transcribeAudio: vi.fn(),
            },
        });

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
        setDesktopApi({
            ollama: {
                checkHealth: vi.fn(),
                primeAudience: vi.fn().mockRejectedValue(Object.assign(
                    new Error('Missing model'),
                    { code: 'model-missing' },
                )),
                generateQuestions: vi.fn(),
                generateFeedback: vi.fn(),
            },
            config: {
                getOllamaConfig: vi.fn(),
                setOllamaConfig: vi.fn(),
            },
            transcription: {
                transcribeAudio: vi.fn(),
            },
        });

        await expect(ollamaClient.primeAudience(audience)).rejects.toMatchObject({
            code: 'model-missing',
        } satisfies Partial<OllamaServiceError>);
    });
});
