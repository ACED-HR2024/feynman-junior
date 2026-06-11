import { TranscriptionConfig } from '../config/transcription';
import { OllamaServiceError } from './ollamaErrors';

export interface TranscriptionHealth {
    reachable: boolean;
    message: string;
}

const FILE_EXTENSIONS: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
    'audio/mp4': 'm4a',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
};

const fileNameFor = (mimeType: string): string => {
    const baseType = mimeType.split(';')[0].trim().toLowerCase();
    return `recording.${FILE_EXTENSIONS[baseType] || 'webm'}`;
};

export const checkTranscriptionHealth = async (baseUrl: string): Promise<TranscriptionHealth> => {
    try {
        // Any HTTP response proves a server is listening; fetch only rejects
        // when nothing answers at the address.
        await fetch(`${baseUrl}/v1/models`);
        return {
            reachable: true,
            message: 'Transcription server is reachable.',
        };
    } catch (error) {
        return {
            reachable: false,
            message: `No transcription server responded at ${baseUrl}.`,
        };
    }
};

export const transcribeAudio = async (
    config: TranscriptionConfig,
    audio: ArrayBuffer,
    mimeType = 'audio/webm',
): Promise<string> => {
    const form = new FormData();
    form.append('file', new Blob([audio], { type: mimeType }), fileNameFor(mimeType));
    form.append('model', config.model);
    form.append('response_format', 'json');

    let response: Response;

    try {
        response = await fetch(`${config.baseUrl}/v1/audio/transcriptions`, {
            method: 'POST',
            body: form,
        });
    } catch (error) {
        throw new OllamaServiceError(
            'speech-unsupported',
            `Could not reach the transcription server at ${config.baseUrl}. Start it, or update the voice settings in Setup.`,
        );
    }

    if (!response.ok) {
        throw new OllamaServiceError(
            'invalid-response',
            `The transcription server rejected the audio (HTTP ${response.status}).`,
        );
    }

    const data = await response.json() as { text?: unknown };

    if (typeof data.text !== 'string') {
        throw new OllamaServiceError(
            'invalid-response',
            'The transcription server returned an unexpected payload.',
        );
    }

    return data.text.trim();
};
