import { OllamaConfig, ollamaConfig } from '../config/ollama';
import { TranscriptionConfig, transcriptionConfig } from '../config/transcription';

export const desktopConfigClient = {
    getOllamaConfig: async (): Promise<OllamaConfig> => {
        if (window.feynman) {
            return window.feynman.config.getOllamaConfig();
        }

        return ollamaConfig;
    },

    setOllamaConfig: async (config: Partial<OllamaConfig>): Promise<OllamaConfig> => {
        if (window.feynman) {
            return window.feynman.config.setOllamaConfig(config);
        }

        return {
            ...ollamaConfig,
            ...config,
        };
    },

    getTranscriptionConfig: async (): Promise<TranscriptionConfig> => {
        if (window.feynman) {
            return window.feynman.config.getTranscriptionConfig();
        }

        return transcriptionConfig;
    },

    setTranscriptionConfig: async (
        config: Partial<TranscriptionConfig>,
    ): Promise<TranscriptionConfig> => {
        if (window.feynman) {
            return window.feynman.config.setTranscriptionConfig(config);
        }

        return {
            ...transcriptionConfig,
            ...config,
        };
    },
};
