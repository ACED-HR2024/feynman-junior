export interface TranscriptionConfig {
    baseUrl: string;
    model: string;
}

export const transcriptionConfig: TranscriptionConfig = {
    baseUrl: process.env.REACT_APP_TRANSCRIPTION_BASE_URL || 'http://localhost:8000',
    model: process.env.REACT_APP_TRANSCRIPTION_MODEL || 'whisper-1',
};
