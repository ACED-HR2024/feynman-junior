import { afterEach, describe, expect, it, vi } from 'vitest';
import { composeSetupStatus, isSetupReady } from './setupStatus';

const ollama = {
    baseUrl: 'http://localhost:11434',
    model: 'phi4-mini',
    temperature: 0.3,
    cache: true,
};

const transcription = {
    baseUrl: 'http://localhost:8000',
    model: 'whisper-1',
};

describe('setupStatus', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('is ready when Ollama responds and the configured model is installed', async () => {
        vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => {
            if (url.includes('/api/tags')) {
                return new Response(JSON.stringify({
                    models: [{ name: 'phi4-mini:latest' }],
                }), { status: 200 });
            }

            return new Response('{}', { status: 200 });
        }));

        const status = await composeSetupStatus(ollama, transcription);

        expect(status.ollama.reachable).toBe(true);
        expect(status.model).toEqual({ configured: 'phi4-mini', available: true });
        expect(status.transcription.reachable).toBe(true);
        expect(isSetupReady(status)).toBe(true);
    });

    it('is not ready when the configured model is missing', async () => {
        vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => {
            if (url.includes('/api/tags')) {
                return new Response(JSON.stringify({
                    models: [{ name: 'llama3.2:3b' }],
                }), { status: 200 });
            }

            throw new TypeError('fetch failed');
        }));

        const status = await composeSetupStatus(ollama, transcription);

        expect(status.ollama.reachable).toBe(true);
        expect(status.model.available).toBe(false);
        expect(status.transcription.reachable).toBe(false);
        expect(isSetupReady(status)).toBe(false);
    });

    it('reports an unreachable Ollama service without throwing', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));

        const status = await composeSetupStatus(ollama, transcription);

        expect(status.ollama.reachable).toBe(false);
        expect(status.ollama.models).toEqual([]);
        expect(status.model.available).toBe(false);
        expect(isSetupReady(status)).toBe(false);
    });
});
