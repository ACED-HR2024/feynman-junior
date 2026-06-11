export interface OllamaConfig {
    baseUrl: string;
    model: string;
    temperature: number;
    cache: boolean;
    /** Max time a single chat request may run before it is aborted, in ms. */
    timeoutMs: number;
}

/** Generous enough for a cold model load, bounded so a wedged server surfaces. */
export const DEFAULT_OLLAMA_TIMEOUT_MS = 120000;

const parseTemperature = (value: string | undefined): number => {
    if (!value) {
        return 1;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 1;
};

export const parseTimeoutMs = (value: string | number | undefined): number => {
    if (value === undefined || value === '') {
        return DEFAULT_OLLAMA_TIMEOUT_MS;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_OLLAMA_TIMEOUT_MS;
};

export const ollamaConfig: OllamaConfig = {
    baseUrl: process.env.REACT_APP_OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.REACT_APP_OLLAMA_MODEL || 'phi4-mini',
    temperature: parseTemperature(process.env.REACT_APP_OLLAMA_TEMPERATURE),
    cache: process.env.REACT_APP_OLLAMA_CACHE !== 'false',
    timeoutMs: parseTimeoutMs(process.env.REACT_APP_OLLAMA_TIMEOUT_MS),
};
