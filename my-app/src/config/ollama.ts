export interface OllamaConfig {
    baseUrl: string;
    model: string;
    temperature: number;
    cache: boolean;
}

const parseTemperature = (value: string | undefined): number => {
    if (!value) {
        return 1;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 1;
};

export const ollamaConfig: OllamaConfig = {
    baseUrl: process.env.REACT_APP_OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.REACT_APP_OLLAMA_MODEL || 'phi4-mini',
    temperature: parseTemperature(process.env.REACT_APP_OLLAMA_TEMPERATURE),
    cache: process.env.REACT_APP_OLLAMA_CACHE !== 'false',
};
