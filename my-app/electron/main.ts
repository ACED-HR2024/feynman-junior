import { app, BrowserWindow, ipcMain, session, shell } from 'electron';
import { join } from 'path';
import { OllamaService } from '../src/services/ollamaService';
import { OllamaServiceError } from '../src/services/ollamaErrors';
import { pullModel } from '../src/services/ollamaSetupService';
import { composeSetupStatus, SetupStatus } from '../src/services/setupStatus';
import {
    FeedbackGenerationPayload,
    IPC_CHANNELS,
    IpcResult,
    QuestionGenerationPayload,
} from '../src/desktop/api';
import { createLogger } from '../src/services/logger';
import { getOllamaConfig, setOllamaConfig } from './config';

const logger = createLogger('main');

let mainWindow: BrowserWindow | null = null;
let ollamaService: OllamaService | null = null;
let serviceConfigKey = '';
let activeModelPull: AbortController | null = null;

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
    logger.error('IPC handler error', error);

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
        ({ session: learningSession, answers }) => (
            getOllamaService().generateFeedback(learningSession, answers)
        ),
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

    handle<void, SetupStatus>(
        IPC_CHANNELS.getSetupStatus,
        () => composeSetupStatus(getOllamaConfig()),
    );

    // Registered without the wrapper because progress events stream back to
    // the renderer that initiated the pull.
    ipcMain.handle(
        IPC_CHANNELS.pullModel,
        async (event, modelName: string): Promise<IpcResult<void>> => {
            if (activeModelPull) {
                return serializeError(new OllamaServiceError(
                    'unknown',
                    'A model download is already in progress.',
                ));
            }

            const controller = new AbortController();
            activeModelPull = controller;

            try {
                await pullModel(getOllamaConfig().baseUrl, modelName, {
                    signal: controller.signal,
                    onProgress: (progress) => {
                        if (!event.sender.isDestroyed()) {
                            event.sender.send(IPC_CHANNELS.modelPullProgress, progress);
                        }
                    },
                });

                return { ok: true, data: undefined };
            } catch (error) {
                return serializeError(error);
            } finally {
                activeModelPull = null;
            }
        },
    );

    handle<void, void>(
        IPC_CHANNELS.cancelModelPull,
        () => {
            activeModelPull?.abort();
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
        show: false,
        backgroundColor: '#f5f5f7',
        ...(process.platform === 'darwin' ? { titleBarStyle: 'hiddenInset' as const } : {}),
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            contextIsolation: true,
            nodeIntegration: false,
            // Must stay true: with the sandbox disabled, onnxruntime-web's WASM
            // (on-device transcription) segfaults the renderer (SIGSEGV, exit
            // code 11) during model load. The preload only uses contextBridge +
            // ipcRenderer, which are fully supported in sandboxed preloads.
            sandbox: true,
        },
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        void shell.openExternal(url);
        return { action: 'deny' };
    });

    // The on-device speech model runs heavy WebAssembly in the renderer. If that
    // (or anything else) crashes the renderer, recover instead of leaving a dead
    // white window, and log why so the failure is diagnosable.
    let crashReloads = 0;
    mainWindow.webContents.on('render-process-gone', (_event, details) => {
        logger.error('renderer process gone', details);

        if (details.reason === 'clean-exit' || crashReloads >= 3) {
            return;
        }

        crashReloads += 1;
        mainWindow?.webContents.openDevTools({ mode: 'detach' });
        mainWindow?.reload();
    });

    mainWindow.webContents.on('unresponsive', () => {
        logger.warn('renderer became unresponsive');
    });

    // Mirror every renderer console line into the main-process terminal so the
    // logs are capturable even when DevTools is closed. Handles both the legacy
    // positional signature and the Electron 36+ event-object form.
    mainWindow.webContents.on('console-message', (...args: unknown[]) => {
        const first = args[0] as
            | { level?: number | string; message?: string; lineNumber?: number; sourceId?: string }
            | undefined;

        let level: number | string | undefined;
        let message: string | undefined;
        let sourceId: string | undefined;
        let line: number | undefined;

        if (first && typeof first === 'object' && 'message' in first) {
            ({ level, message, sourceId, lineNumber: line } = first as {
                level?: number | string; message?: string; lineNumber?: number; sourceId?: string;
            });
        } else {
            [, level, message, line, sourceId] = args as [unknown, number, string, number, string];
        }

        logger.info('renderer console', { level, message, sourceId, line });
    });

    if (process.env.ELECTRON_RENDERER_URL) {
        void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
        void mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
    }
};

registerIpcHandlers();

void app.whenReady().then(() => {
    // Voice input records through getUserMedia; allow microphone access and
    // deny every other permission the renderer could request.
    session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
        callback(permission === 'media');
    });

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
