import { createLogger } from './logger';

const logger = createLogger('voiceTranscriber');

// The "tiny" Moonshine model is the fastest/smallest; weights stream from
// Moonshine's CDN on first use and are cached by the browser thereafter.
const MODEL_URL = 'model/tiny';

export interface VoiceTranscriberCallbacks {
    /** Model + VAD download/initialization has begun. */
    onModelLoadStarted?: () => void;
    /** Model is ready; transcription is about to start. */
    onModelLoaded?: () => void;
    /** Microphone is live and listening. */
    onTranscribeStarted?: () => void;
    /** Transcription has stopped. */
    onTranscribeStopped?: () => void;
    /** Speculative, in-progress transcript for the current utterance. */
    onTranscriptionUpdated?: (text: string) => void;
    /** A finalized transcript segment, committed at a pause in speech. */
    onTranscriptionCommitted?: (text: string) => void;
    /** A recoverable failure (permission denied, unsupported platform, etc.). */
    onError?: (message: string) => void;
}

export interface VoiceTranscriberHandle {
    start: () => Promise<void>;
    stop: () => void;
}

export const isVoiceTranscriptionSupported = (): boolean => (
    typeof navigator !== 'undefined'
    && typeof navigator.mediaDevices?.getUserMedia === 'function'
    && typeof WebAssembly !== 'undefined'
);

/** Snapshot of the runtime features that decide onnxruntime-web's WASM path. */
const logEnvironmentDiagnostics = (): void => {
    const wasmFeatures: Record<string, boolean> = {};
    try {
        // SIMD probe (smallest valid module that uses v128).
        wasmFeatures.simd = WebAssembly.validate(new Uint8Array([
            0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3,
            2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11,
        ]));
    } catch {
        wasmFeatures.simd = false;
    }

    logger.info('environment diagnostics', {
        userAgentIsElectron: typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron'),
        crossOriginIsolated: typeof crossOriginIsolated !== 'undefined' ? crossOriginIsolated : 'undefined',
        hasSharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
        hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 'n/a',
        hasWebAssembly: typeof WebAssembly !== 'undefined',
        wasmSimd: wasmFeatures.simd,
        isSecureContext: typeof isSecureContext !== 'undefined' ? isSecureContext : 'undefined',
    });
};

/**
 * Creates an on-device speech-to-text handle backed by MoonshineJS. All audio
 * stays in the renderer — there is no transcription server. The heavy Moonshine
 * bundle is imported lazily so it only loads when the user actually records.
 */
export const createVoiceTranscriber = async (
    callbacks: VoiceTranscriberCallbacks,
): Promise<VoiceTranscriberHandle> => {
    logger.info('createVoiceTranscriber: start');
    logEnvironmentDiagnostics();

    logger.info('createVoiceTranscriber: importing @moonshine-ai/moonshine-js');
    const Moonshine = await import('@moonshine-ai/moonshine-js');
    logger.info('createVoiceTranscriber: moonshine module loaded', {
        assetPaths: Moonshine.Settings?.BASE_ASSET_PATH,
    });

    logger.info('createVoiceTranscriber: constructing MicrophoneTranscriber', { model: MODEL_URL });
    const transcriber = new Moonshine.MicrophoneTranscriber(
        MODEL_URL,
        {
            onPermissionsRequested: () => logger.info('lifecycle: onPermissionsRequested'),
            onModelLoadStarted: () => {
                logger.info('lifecycle: onModelLoadStarted (downloading/initializing model + VAD)');
                callbacks.onModelLoadStarted?.();
            },
            onModelLoaded: () => {
                logger.info('lifecycle: onModelLoaded (ready)');
                callbacks.onModelLoaded?.();
            },
            onTranscribeStarted: () => {
                logger.info('lifecycle: onTranscribeStarted (mic live)');
                callbacks.onTranscribeStarted?.();
            },
            onTranscribeStopped: () => {
                logger.info('lifecycle: onTranscribeStopped');
                callbacks.onTranscribeStopped?.();
            },
            onSpeechStart: () => logger.info('lifecycle: onSpeechStart'),
            onSpeechEnd: () => logger.info('lifecycle: onSpeechEnd'),
            onTranscriptionUpdated: (text) => {
                logger.info('lifecycle: onTranscriptionUpdated', { length: text.length });
                callbacks.onTranscriptionUpdated?.(text);
            },
            onTranscriptionCommitted: (text) => {
                logger.info('lifecycle: onTranscriptionCommitted', { text });
                if (text.trim()) {
                    callbacks.onTranscriptionCommitted?.(text.trim());
                }
            },
            onError: (error) => {
                const message = error instanceof Error ? error.message : String(error);
                logger.error('lifecycle: onError', error);
                callbacks.onError?.(message);
            },
        },
        // Use VAD mode: commit a transcript segment at each natural pause.
        true,
    );
    logger.info('createVoiceTranscriber: MicrophoneTranscriber constructed');

    return {
        start: async () => {
            logger.info('transcriber.start(): requesting mic + loading model');
            try {
                await transcriber.start();
                logger.info('transcriber.start(): resolved');
            } catch (error) {
                logger.error('transcriber.start(): threw', error);
                throw error;
            }
        },
        stop: () => {
            logger.info('transcriber.stop()');
            transcriber.stop();
        },
    };
};
