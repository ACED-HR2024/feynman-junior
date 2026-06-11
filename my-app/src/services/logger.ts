export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
    debug(message: string, ...details: unknown[]): void;
    info(message: string, ...details: unknown[]): void;
    warn(message: string, ...details: unknown[]): void;
    error(message: string, ...details: unknown[]): void;
}

const LEVEL_ORDER: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
};

// Errors do not serialize through JSON, so pull out the useful fields by hand.
const normalizeDetail = (detail: unknown): unknown => {
    if (detail instanceof Error) {
        return {
            name: detail.name,
            message: detail.message,
            ...(('code' in detail) ? { code: (detail as { code?: unknown }).code } : {}),
            stack: detail.stack,
        };
    }

    return detail;
};

const minLevel: LogLevel = 'debug';

const consoleFor = (level: LogLevel): (...args: unknown[]) => void => {
    switch (level) {
        case 'error':
            return console.error.bind(console);
        case 'warn':
            return console.warn.bind(console);
        case 'debug':
            return (console.debug ?? console.log).bind(console);
        default:
            return console.log.bind(console);
    }
};

/**
 * Creates a scoped logger that works in both the Electron main process and the
 * renderer. Output is prefixed with a timestamp, level, and scope so failures
 * are traceable in the terminal (main) and DevTools console (renderer).
 */
export const createLogger = (scope: string): Logger => {
    const log = (level: LogLevel, message: string, details: unknown[]): void => {
        if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) {
            return;
        }

        const prefix = `${new Date().toISOString()} ${level.toUpperCase()} [${scope}]`;
        consoleFor(level)(prefix, message, ...details.map(normalizeDetail));
    };

    return {
        debug: (message, ...details) => log('debug', message, details),
        info: (message, ...details) => log('info', message, details),
        warn: (message, ...details) => log('warn', message, details),
        error: (message, ...details) => log('error', message, details),
    };
};
