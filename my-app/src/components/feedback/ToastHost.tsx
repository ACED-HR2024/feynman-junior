import React, { useEffect, useRef, useState } from 'react';
import { subscribeToToasts, Toast } from '../../services/toastBus';

const TONE_LABEL: Record<Toast['tone'], string> = {
    info: 'Notice',
    success: 'Success',
    warning: 'Warning',
    error: 'Error',
};

const ToastHost: React.FC = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const dismiss = (id: string) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
        const timer = timersRef.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timersRef.current.delete(id);
        }
    };

    useEffect(() => {
        const unsubscribe = subscribeToToasts((toast) => {
            setToasts((current) => [...current, toast]);

            if (toast.duration > 0) {
                const timer = setTimeout(() => dismiss(toast.id), toast.duration);
                timersRef.current.set(toast.id, timer);
            }
        });

        const timers = timersRef.current;
        return () => {
            unsubscribe();
            timers.forEach((timer) => clearTimeout(timer));
            timers.clear();
        };
    }, []);

    if (toasts.length === 0) {
        return null;
    }

    return (
        <div className="toast-host" role="region" aria-label="Notifications">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`toast toast-${toast.tone}`}
                    role={toast.tone === 'error' ? 'alert' : 'status'}
                >
                    <div className="toast-body">
                        <strong className="toast-title">{toast.title}</strong>
                        {toast.message && <span className="toast-message">{toast.message}</span>}
                    </div>
                    <button
                        type="button"
                        className="toast-close"
                        onClick={() => dismiss(toast.id)}
                        aria-label={`Dismiss ${TONE_LABEL[toast.tone].toLowerCase()} notification`}
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
};

export default ToastHost;
