import { ollamaConfig } from '../config/ollama';
import { transcriptionConfig } from '../config/transcription';
import { ModelPullProgress, pullModel } from './ollamaSetupService';
import { composeSetupStatus, SetupStatus } from './setupStatus';

let browserPull: AbortController | null = null;

export const setupClient = {
    getStatus: async (): Promise<SetupStatus> => {
        if (window.feynman) {
            return window.feynman.setup.getStatus();
        }

        return composeSetupStatus(ollamaConfig, transcriptionConfig);
    },

    pullModel: async (
        model: string,
        onProgress?: (progress: ModelPullProgress) => void,
    ): Promise<void> => {
        if (window.feynman) {
            const unsubscribe = onProgress
                ? window.feynman.setup.onModelPullProgress(onProgress)
                : undefined;

            try {
                await window.feynman.setup.pullModel(model);
            } finally {
                unsubscribe?.();
            }

            return;
        }

        browserPull = new AbortController();

        try {
            await pullModel(ollamaConfig.baseUrl, model, {
                onProgress,
                signal: browserPull.signal,
            });
        } finally {
            browserPull = null;
        }
    },

    cancelModelPull: async (): Promise<void> => {
        if (window.feynman) {
            return window.feynman.setup.cancelModelPull();
        }

        browserPull?.abort();
    },
};
