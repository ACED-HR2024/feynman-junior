import { transcriptionConfig } from '../config/transcription';
import { transcribeAudio } from './transcriptionService';

export const transcriptionClient = {
    transcribeAudio: async (audio: Blob): Promise<string> => {
        if (window.feynman) {
            return window.feynman.transcription.transcribeAudio({
                audio: await audio.arrayBuffer(),
                mimeType: audio.type,
            });
        }

        return transcribeAudio(
            transcriptionConfig,
            await audio.arrayBuffer(),
            audio.type || undefined,
        );
    },
};
