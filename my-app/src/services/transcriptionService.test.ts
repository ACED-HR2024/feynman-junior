import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkTranscriptionHealth, transcribeAudio } from './transcriptionService';

const config = {
    baseUrl: 'http://localhost:8000',
    model: 'whisper-1',
};

const audio = new TextEncoder().encode('fake-audio').buffer as ArrayBuffer;

describe('transcriptionService', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('posts audio as multipart form data and returns the trimmed transcript', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ text: '  Gravity pulls things down.  ' }), { status: 200 }),
        );
        vi.stubGlobal('fetch', fetchMock);

        const transcript = await transcribeAudio(config, audio, 'audio/webm;codecs=opus');

        expect(transcript).toBe('Gravity pulls things down.');
        expect(fetchMock).toHaveBeenCalledWith(
            'http://localhost:8000/v1/audio/transcriptions',
            expect.objectContaining({ method: 'POST' }),
        );

        const body = fetchMock.mock.calls[0][1].body as FormData;
        expect(body.get('model')).toBe('whisper-1');
        expect((body.get('file') as File).name).toBe('recording.webm');
    });

    it('reports an unreachable transcription server with a typed error', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));

        await expect(transcribeAudio(config, audio)).rejects.toMatchObject({
            code: 'speech-unsupported',
        });
    });

    it('reports server rejections with the HTTP status', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 500 })));

        await expect(transcribeAudio(config, audio)).rejects.toMatchObject({
            code: 'invalid-response',
            message: expect.stringContaining('500'),
        });
    });

    it('rejects payloads without a text field', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ result: 'missing' }), { status: 200 }),
        ));

        await expect(transcribeAudio(config, audio)).rejects.toMatchObject({
            code: 'invalid-response',
        });
    });

    it('treats any HTTP response as a reachable server', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not found', { status: 404 })));

        await expect(checkTranscriptionHealth(config.baseUrl)).resolves.toMatchObject({
            reachable: true,
        });
    });

    it('reports a missing server as unreachable', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));

        await expect(checkTranscriptionHealth(config.baseUrl)).resolves.toMatchObject({
            reachable: false,
        });
    });
});
