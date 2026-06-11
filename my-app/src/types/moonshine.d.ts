/**
 * Minimal ambient declarations for `@moonshine-ai/moonshine-js`, which ships
 * JavaScript without bundled type definitions. Only the surface this app uses
 * is declared. See the package source at node_modules/@moonshine-ai/moonshine-js/src.
 */
declare module '@moonshine-ai/moonshine-js' {
    export interface TranscriberCallbacks {
        onPermissionsRequested: () => unknown;
        onError: (error: unknown) => unknown;
        onModelLoadStarted: () => unknown;
        onModelLoaded: () => unknown;
        onTranscribeStarted: () => unknown;
        onTranscribeStopped: () => unknown;
        onTranscriptionUpdated: (text: string) => unknown;
        onTranscriptionCommitted: (text: string, buffer?: AudioBuffer) => unknown;
        onFrame: (probs: unknown, frame: unknown, ema: unknown) => unknown;
        onSpeechStart: () => unknown;
        onSpeechEnd: () => unknown;
    }

    export class Transcriber {
        constructor(
            modelURL: string,
            callbacks?: Partial<TranscriberCallbacks>,
            useVAD?: boolean,
            precision?: string,
        );

        isActive: boolean;

        start(): Promise<void>;

        stop(): void;

        attachStream(stream: MediaStream): void;
    }

    export class MicrophoneTranscriber extends Transcriber {}

    export const Settings: {
        BASE_ASSET_PATH: {
            MOONSHINE: string;
            ONNX_RUNTIME: string;
            SILERO_VAD: string;
        };
        VERBOSE_LOGGING: boolean;
        [key: string]: unknown;
    };
}
