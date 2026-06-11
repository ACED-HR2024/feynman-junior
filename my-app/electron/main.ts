import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { join } from 'path';
import { OllamaService } from '../src/services/ollamaService';
import { OllamaServiceError } from '../src/services/ollamaErrors';
import {
    FeedbackGenerationPayload,
    IPC_CHANNELS,
    IpcResult,
    QuestionGenerationPayload,
    TranscriptionPayload,
} from '../src/desktop/api';
import { getOllamaConfig, setOllamaConfig } from './config';

let mainWindow: BrowserWindow | null = null;
let ollamaService: OllamaService | null = null;
let serviceConfigKey = '';

const getOllamaService = (): OllamaService => {
    const config = getOllamaConfig();
    const configKey = JSON.stringify(config);

    if (!ollamaService || serviceConfigKey !== configKey) {
        ollamaService = new OllamaService(config);
        serviceConfigKey = configKey;
    }

    return ollamaService;
};

const serializeError = (error: unknown): IpcResult<never> => {
    if (error instanceof OllamaServiceError) {
        return {
            ok: false,
            error: {
                name: error.name,
                message: error.message,
                code: error.code,
            },
        };
    }

    if (error instanceof Error) {
        return {
            ok: false,
            error: {
                name: error.name,
                message: error.message,
            },
        };
    }

    return {
        ok: false,
        error: {
            name: 'Error',
            message: 'An unknown desktop process error occurred.',
        },
    };
};

const handle = <Payload, Result>(
    channel: string,
    handler: (payload: Payload) => Promise<Result> | Result,
): void => {
    ipcMain.handle(channel, async (_event, payload: Payload): Promise<IpcResult<Result>> => {
        try {
            return {
                ok: true,
                data: await handler(payload),
            };
        } catch (error) {
            return serializeError(error);
        }
    });
};

const registerIpcHandlers = (): void => {
    handle<void, Awaited<ReturnType<OllamaService['checkHealth']>>>(
        IPC_CHANNELS.checkOllamaHealth,
        () => getOllamaService().checkHealth(),
    );

    handle<Parameters<OllamaService['primeAudience']>[0], void>(
        IPC_CHANNELS.primeAudience,
        async (audience) => {
            await getOllamaService().primeAudience(audience);
        },
    );

    handle<QuestionGenerationPayload, Awaited<ReturnType<OllamaService['generateQuestions']>>>(
        IPC_CHANNELS.generateQuestions,
        ({ audience, topic, explanation }) => (
            getOllamaService().generateQuestions(audience, topic, explanation)
        ),
    );

    handle<FeedbackGenerationPayload, Awaited<ReturnType<OllamaService['generateFeedback']>>>(
        IPC_CHANNELS.generateFeedback,
        ({ session, answers }) => getOllamaService().generateFeedback(session, answers),
    );

    handle<void, ReturnType<typeof getOllamaConfig>>(
        IPC_CHANNELS.getOllamaConfig,
        () => getOllamaConfig(),
    );

    handle<Parameters<typeof setOllamaConfig>[0], ReturnType<typeof setOllamaConfig>>(
        IPC_CHANNELS.setOllamaConfig,
        (config) => {
            const nextConfig = setOllamaConfig(config);
            ollamaService = null;
            serviceConfigKey = '';
            return nextConfig;
        },
    );

    handle<TranscriptionPayload, string>(
        IPC_CHANNELS.transcribeAudio,
        () => {
            throw new OllamaServiceError(
                'speech-unsupported',
                'Local transcription is not configured yet.',
            );
        },
    );
};

const createWindow = (): void => {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 900,
        minWidth: 960,
        minHeight: 700,
        title: 'Feynman Junior',
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
        },
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        void shell.openExternal(url);
        return { action: 'deny' };
    });

    if (process.env.ELECTRON_RENDERER_URL) {
        void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    } else {
        void mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
    }
};

registerIpcHandlers();

void app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
