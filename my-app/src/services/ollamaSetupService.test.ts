import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    isModelInstalled,
    listInstalledModels,
    ModelPullProgress,
    pullModel,
} from './ollamaSetupService';

const baseUrl = 'http://localhost:11434';

const streamOf = (lines: string[]): ReadableStream<Uint8Array> => (
    new ReadableStream({
        start(controller) {
            const encoder = new TextEncoder();
            lines.forEach((line) => controller.enqueue(encoder.encode(`${line}\n`)));
            controller.close();
        },
    })
);

describe('ollamaSetupService', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('lists installed models from the tags endpoint', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
            models: [
                { name: 'phi4-mini:latest', size: 2600000000 },
                { model: 'llama3.2:3b' },
                { size: 1 },
            ],
        }), { status: 200 })));

        await expect(listInstalledModels(baseUrl)).resolves.toEqual([
            { name: 'phi4-mini:latest', sizeBytes: 2600000000 },
            { name: 'llama3.2:3b', sizeBytes: undefined },
        ]);
    });

    it('throws a typed error when Ollama is unreachable', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));

        await expect(listInstalledModels(baseUrl)).rejects.toMatchObject({
            code: 'ollama-unavailable',
        });
    });

    it('matches configured models against bare and tagged names', () => {
        const models = [{ name: 'phi4-mini:latest' }, { name: 'llama3.2:3b' }];

        expect(isModelInstalled(models, 'phi4-mini')).toBe(true);
        expect(isModelInstalled(models, 'llama3.2:3b')).toBe(true);
        expect(isModelInstalled(models, 'mistral')).toBe(false);
    });

    it('streams pull progress events in order', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(streamOf([
            JSON.stringify({ status: 'pulling manifest' }),
            JSON.stringify({ status: 'downloading', completed: 50, total: 100 }),
            JSON.stringify({ status: 'success' }),
        ]), { status: 200 })));

        const events: ModelPullProgress[] = [];
        await pullModel(baseUrl, 'phi4-mini', {
            onProgress: (progress) => events.push(progress),
        });

        expect(events.map((event) => event.status)).toEqual([
            'pulling manifest',
            'downloading',
            'success',
        ]);
        expect(events[1]).toMatchObject({ model: 'phi4-mini', completed: 50, total: 100 });
    });

    it('surfaces pull errors reported in the stream', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(streamOf([
            JSON.stringify({ status: 'pulling manifest' }),
            JSON.stringify({ error: 'pull model manifest: file does not exist' }),
        ]), { status: 200 })));

        await expect(pullModel(baseUrl, 'not-a-model', {})).rejects.toMatchObject({
            code: 'model-missing',
            message: expect.stringContaining('does not exist'),
        });
    });
});
