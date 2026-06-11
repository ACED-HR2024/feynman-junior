import { describe, expect, it, vi } from 'vitest';

const { invokeMock } = vi.hoisted(() => ({ invokeMock: vi.fn() }));

vi.mock('@langchain/ollama', () => ({
    ChatOllama: class {
        invoke = invokeMock;
    },
}));

import { OllamaService } from './ollamaService';
import { OllamaServiceError } from './ollamaErrors';
import { Audience } from '../types/session';

const audience: Audience = {
    id: 'middle',
    label: 'Middle school kids',
    description: 'Students ready for basic abstractions.',
    promptGuidance: 'Use plain language.',
};

const config = {
    baseUrl: 'http://localhost:11434',
    model: 'phi4-mini',
    temperature: 0.3,
    cache: true,
    timeoutMs: 40,
};

describe('OllamaService timeout', () => {
    it('throws a typed timeout error when invoke never resolves', async () => {
        // Resolve only if the abort signal fires; otherwise hang forever.
        invokeMock.mockImplementation((_messages, options: { signal?: AbortSignal }) => (
            new Promise((_resolve, reject) => {
                options?.signal?.addEventListener('abort', () => {
                    reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
                });
            })
        ));

        const service = new OllamaService(config);

        await expect(service.generateQuestions(audience, 'Gravity', 'Things fall.'))
            .rejects.toMatchObject({
                name: 'OllamaServiceError',
                code: 'timeout',
            });
    });

    it('returns parsed output when invoke resolves in time', async () => {
        invokeMock.mockResolvedValue({
            content: JSON.stringify({
                questions: [{ prompt: 'Why?' }],
                nextSteps: [],
            }),
        });

        const service = new OllamaService(config);
        const result = await service.generateQuestions(audience, 'Gravity', 'Things fall.');

        expect(result.questions).toHaveLength(1);
        expect(invokeMock).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ signal: expect.any(AbortSignal) }),
        );
    });

    it('wraps non-timeout invoke failures as invalid-response', async () => {
        invokeMock.mockRejectedValue(new Error('boom'));

        const service = new OllamaService(config);

        await expect(service.generateQuestions(audience, 'Gravity', 'Things fall.'))
            .rejects.toBeInstanceOf(OllamaServiceError);
    });
});
