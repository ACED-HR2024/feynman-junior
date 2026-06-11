import { describe, expect, it, vi } from 'vitest';
import { notify, subscribeToToasts } from './toastBus';

describe('toastBus', () => {
    it('delivers notifications to subscribers with tone defaults', () => {
        const listener = vi.fn();
        const unsubscribe = subscribeToToasts(listener);

        notify({ title: 'Heads up' });
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener.mock.calls[0][0]).toMatchObject({
            title: 'Heads up',
            tone: 'info',
            duration: 5000,
        });

        unsubscribe();
        notify({ title: 'Ignored' });
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('makes error toasts sticky by default', () => {
        const listener = vi.fn();
        const unsubscribe = subscribeToToasts(listener);

        notify({ title: 'Boom', tone: 'error' });
        expect(listener.mock.calls[0][0]).toMatchObject({ tone: 'error', duration: 0 });

        unsubscribe();
    });

    it('honors an explicit duration override', () => {
        const listener = vi.fn();
        const unsubscribe = subscribeToToasts(listener);

        notify({ title: 'Quick', tone: 'error', duration: 1000 });
        expect(listener.mock.calls[0][0]).toMatchObject({ duration: 1000 });

        unsubscribe();
    });
});
