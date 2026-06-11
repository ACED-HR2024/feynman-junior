import { OllamaServiceError } from './ollamaErrors';

export interface InstalledModel {
    name: string;
    sizeBytes?: number;
}

export interface ModelPullProgress {
    model: string;
    status: string;
    completed?: number;
    total?: number;
}

export interface PullModelOptions {
    onProgress?: (progress: ModelPullProgress) => void;
    signal?: AbortSignal;
}

interface OllamaTagsResponse {
    models?: Array<{ name?: string; model?: string; size?: number }>;
}

interface PullStreamLine {
    status?: string;
    completed?: number;
    total?: number;
    error?: string;
}

export const listInstalledModels = async (baseUrl: string): Promise<InstalledModel[]> => {
    let response: Response;

    try {
        response = await fetch(`${baseUrl}/api/tags`);
    } catch (error) {
        throw new OllamaServiceError(
            'ollama-unavailable',
            `Unable to reach Ollama at ${baseUrl}. Confirm that \`ollama serve\` is running.`,
        );
    }

    if (!response.ok) {
        throw new OllamaServiceError('ollama-unavailable', `Ollama returned HTTP ${response.status}.`);
    }

    const data = await response.json() as OllamaTagsResponse;

    return (data.models || [])
        .map((model) => ({
            name: model.name || model.model || '',
            sizeBytes: model.size,
        }))
        .filter((model) => model.name);
};

export const isModelInstalled = (models: InstalledModel[], modelName: string): boolean => (
    models.some((model) => (
        model.name === modelName ||
        model.name.startsWith(`${modelName}:`)
    ))
);

export const pullModel = async (
    baseUrl: string,
    modelName: string,
    { onProgress, signal }: PullModelOptions = {},
): Promise<void> => {
    let response: Response;

    try {
        response = await fetch(`${baseUrl}/api/pull`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modelName, stream: true }),
            signal,
        });
    } catch (error) {
        if (signal?.aborted) {
            throw new OllamaServiceError('unknown', `Download of "${modelName}" was cancelled.`);
        }

        throw new OllamaServiceError(
            'ollama-unavailable',
            `Unable to reach Ollama at ${baseUrl}. Confirm that \`ollama serve\` is running.`,
        );
    }

    if (!response.ok || !response.body) {
        throw new OllamaServiceError(
            'model-missing',
            `Ollama could not start downloading "${modelName}" (HTTP ${response.status}).`,
        );
    }

    const handleLine = (line: string) => {
        if (!line.trim()) {
            return;
        }

        let parsed: PullStreamLine;

        try {
            parsed = JSON.parse(line) as PullStreamLine;
        } catch (error) {
            return;
        }

        if (parsed.error) {
            throw new OllamaServiceError('model-missing', parsed.error);
        }

        onProgress?.({
            model: modelName,
            status: parsed.status || 'downloading',
            completed: parsed.completed,
            total: parsed.total,
        });
    };

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffered = '';

    try {
        for (;;) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            buffered += decoder.decode(value, { stream: true });
            const lines = buffered.split('\n');
            buffered = lines.pop() || '';
            lines.forEach(handleLine);
        }

        handleLine(buffered);
    } catch (error) {
        if (signal?.aborted) {
            throw new OllamaServiceError('unknown', `Download of "${modelName}" was cancelled.`);
        }

        throw error;
    }
};
