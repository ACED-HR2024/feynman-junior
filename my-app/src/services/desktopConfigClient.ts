import { OllamaConfig, ollamaConfig } from '../config/ollama';

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
};
