import { OllamaServiceError } from './ollamaErrors';

export const transcriptionClient = {
    transcribeAudio: async (audio: Blob): Promise<string> => {
        if (!window.feynman) {
            throw new OllamaServiceError(
                'speech-unsupported',
                'Desktop transcription is only available in the Electron app.',
            );
        }

        return window.feynman.transcription.transcribeAudio({
            audio: await audio.arrayBuffer(),
            mimeType: audio.type,
        });
    },
};
