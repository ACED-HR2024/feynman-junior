import { app } from 'electron';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { parseTimeoutMs, type OllamaConfig } from '../src/config/ollama';

interface DesktopConfig {
    ollama?: Partial<OllamaConfig>;
}

let cachedConfig: DesktopConfig | null = null;

const parseTemperature = (value: string | number | undefined): number => {
    if (value === undefined || value === '') {
        return 0.3;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0.3;
};

const configPath = (): string => join(app.getPath('userData'), 'feynman-junior-config.json');

const loadConfig = (): DesktopConfig => {
    if (cachedConfig) {
        return cachedConfig;
    }

    const path = configPath();

    if (!existsSync(path)) {
        cachedConfig = {};
        return cachedConfig;
    }

    try {
        cachedConfig = JSON.parse(readFileSync(path, 'utf-8')) as DesktopConfig;
    } catch (error) {
        cachedConfig = {};
    }

    return cachedConfig;
};

const saveConfig = (config: DesktopConfig): void => {
    cachedConfig = config;
    writeFileSync(configPath(), JSON.stringify(config, null, 2));
};

export const getOllamaConfig = (): OllamaConfig => {
    const stored = loadConfig().ollama || {};

    return {
        baseUrl: stored.baseUrl || process.env.REACT_APP_OLLAMA_BASE_URL || 'http://localhost:11434',
        model: stored.model || process.env.REACT_APP_OLLAMA_MODEL || 'phi4-mini',
        temperature: parseTemperature(stored.temperature ?? process.env.REACT_APP_OLLAMA_TEMPERATURE),
        cache: stored.cache ?? process.env.REACT_APP_OLLAMA_CACHE !== 'false',
        timeoutMs: parseTimeoutMs(stored.timeoutMs ?? process.env.REACT_APP_OLLAMA_TIMEOUT_MS),
    };
};

export const setOllamaConfig = (nextConfig: Partial<OllamaConfig>): OllamaConfig => {
    const current = loadConfig();
    const ollama = {
        ...getOllamaConfig(),
        ...nextConfig,
    };

    saveConfig({
        ...current,
        ollama,
    });

    return getOllamaConfig();
};
