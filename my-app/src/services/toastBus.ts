export type ToastTone = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
    id: string;
    title: string;
    message?: string;
    tone: ToastTone;
    /** Auto-dismiss delay in ms. Use 0 to require manual dismissal. */
    duration: number;
}

export interface ToastInput {
    title: string;
    message?: string;
    tone?: ToastTone;
    duration?: number;
}

type Listener = (toast: Toast) => void;

const listeners = new Set<Listener>();

const DEFAULT_DURATION: Record<ToastTone, number> = {
    info: 5000,
    success: 4000,
    warning: 7000,
    error: 0,
};

let counter = 0;

const nextId = (): string => {
    counter += 1;
    return `toast-${Date.now()}-${counter}`;
};

/**
 * Publishes a toast to every subscribed host. Safe to call from non-React code
 * (services, hooks) so error paths can raise UI notifications without prop
 * drilling. No-ops silently if no host is mounted yet.
 */
export const notify = (input: ToastInput): string => {
    const tone = input.tone ?? 'info';
    const toast: Toast = {
        id: nextId(),
        title: input.title,
        message: input.message,
        tone,
        duration: input.duration ?? DEFAULT_DURATION[tone],
    };

    listeners.forEach((listener) => listener(toast));
    return toast.id;
};

export const subscribeToToasts = (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};
