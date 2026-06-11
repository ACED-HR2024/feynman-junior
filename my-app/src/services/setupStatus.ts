import { OllamaConfig } from '../config/ollama';
import { InstalledModel, isModelInstalled, listInstalledModels } from './ollamaSetupService';

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
        mode: 'on-device';
        available: boolean;
        message: string;
    };
}

export const isSetupReady = (status: SetupStatus): boolean => (
    status.ollama.reachable && status.model.available
);

export const composeSetupStatus = async (
    ollama: OllamaConfig,
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
        // Voice transcription runs entirely in the renderer via MoonshineJS —
        // no separate server is required, so it is always available in-app.
        transcription: {
            mode: 'on-device',
            available: true,
            message: 'Voice runs on-device (MoonshineJS) — no server required.',
        },
    };
};
