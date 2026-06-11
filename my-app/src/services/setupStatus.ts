import { OllamaConfig } from '../config/ollama';
import { TranscriptionConfig } from '../config/transcription';
import { InstalledModel, isModelInstalled, listInstalledModels } from './ollamaSetupService';
import { checkTranscriptionHealth } from './transcriptionService';

export interface SetupStatus {
    ollama: {
        baseUrl: string;
        reachable: boolean;
        message: string;
        models: InstalledModel[];
    };
    model: {
        configured: string;
        available: boolean;
    };
    transcription: {
        baseUrl: string;
        model: string;
        reachable: boolean;
        message: string;
    };
}

export const isSetupReady = (status: SetupStatus): boolean => (
    status.ollama.reachable && status.model.available
);

export const composeSetupStatus = async (
    ollama: OllamaConfig,
    transcription: TranscriptionConfig,
): Promise<SetupStatus> => {
    let models: InstalledModel[] = [];
    let reachable = true;
    let message = 'Ollama is running.';

    try {
        models = await listInstalledModels(ollama.baseUrl);
    } catch (error) {
        reachable = false;
        message = error instanceof Error
            ? error.message
            : `Unable to reach Ollama at ${ollama.baseUrl}.`;
    }

    const transcriptionHealth = await checkTranscriptionHealth(transcription.baseUrl);

    return {
        ollama: {
            baseUrl: ollama.baseUrl,
            reachable,
            message,
            models,
        },
        model: {
            configured: ollama.model,
            available: reachable && isModelInstalled(models, ollama.model),
        },
        transcription: {
            baseUrl: transcription.baseUrl,
            model: transcription.model,
            reachable: transcriptionHealth.reachable,
            message: transcriptionHealth.message,
        },
    };
};
