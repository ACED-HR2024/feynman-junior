import { describe, expect, it } from 'vitest';
import { IPC_CHANNELS } from './api';

describe('desktop IPC contract', () => {
    it('uses unique channel names for exposed desktop capabilities', () => {
        const channels = Object.values(IPC_CHANNELS);

        expect(new Set(channels).size).toBe(channels.length);
        expect(channels).toEqual(expect.arrayContaining([
            'ollama:check-health',
            'ollama:generate-questions',
            'ollama:generate-feedback',
            'config:get-ollama',
            'config:get-transcription',
            'transcription:transcribe-audio',
            'setup:get-status',
            'setup:pull-model',
            'setup:cancel-pull',
            'setup:pull-progress',
        ]));
    });
});
