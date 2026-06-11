import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import {
    FeynmanDesktopApi,
    FeedbackGenerationPayload,
    IPC_CHANNELS,
    IpcResult,
    QuestionGenerationPayload,
    TranscriptionPayload,
} from '../src/desktop/api';
import type { Audience } from '../src/types/session';
import type { OllamaConfig } from '../src/config/ollama';
import type { TranscriptionConfig } from '../src/config/transcription';
import type { ModelPullProgress } from '../src/services/ollamaSetupService';

const invoke = async <Result, Payload = void>(
    channel: string,
    payload?: Payload,
): Promise<Result> => {
    const result = await ipcRenderer.invoke(channel, payload) as IpcResult<Result>;

    if (result.ok) {
        return result.data;
    }

    const error = new Error(result.error.message) as Error & { code?: string };
    error.name = result.error.name;
    error.code = result.error.code;
    throw error;
};

const api: FeynmanDesktopApi = {
    ollama: {
        checkHealth: () => invoke(IPC_CHANNELS.checkOllamaHealth),
        primeAudience: (audience: Audience) => (
            invoke<void, Audience>(IPC_CHANNELS.primeAudience, audience)
        ),
        generateQuestions: (payload: QuestionGenerationPayload) => (
            invoke(IPC_CHANNELS.generateQuestions, payload)
        ),
        generateFeedback: (payload: FeedbackGenerationPayload) => (
            invoke(IPC_CHANNELS.generateFeedback, payload)
        ),
    },
    config: {
        getOllamaConfig: () => invoke(IPC_CHANNELS.getOllamaConfig),
        setOllamaConfig: (config: Partial<OllamaConfig>) => (
            invoke(IPC_CHANNELS.setOllamaConfig, config)
        ),
        getTranscriptionConfig: () => invoke(IPC_CHANNELS.getTranscriptionConfig),
        setTranscriptionConfig: (config: Partial<TranscriptionConfig>) => (
            invoke(IPC_CHANNELS.setTranscriptionConfig, config)
        ),
    },
    transcription: {
        transcribeAudio: (payload: TranscriptionPayload) => (
            invoke(IPC_CHANNELS.transcribeAudio, payload)
        ),
    },
    setup: {
        getStatus: () => invoke(IPC_CHANNELS.getSetupStatus),
        pullModel: (model: string) => (
            invoke<void, string>(IPC_CHANNELS.pullModel, model)
        ),
        cancelModelPull: () => invoke(IPC_CHANNELS.cancelModelPull),
        onModelPullProgress: (listener: (progress: ModelPullProgress) => void) => {
            const subscription = (_event: IpcRendererEvent, progress: ModelPullProgress) => {
                listener(progress);
            };

            ipcRenderer.on(IPC_CHANNELS.modelPullProgress, subscription);

            return () => {
                ipcRenderer.removeListener(IPC_CHANNELS.modelPullProgress, subscription);
            };
        },
    },
};

contextBridge.exposeInMainWorld('feynman', api);
