import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSpeechRecognition } from './useSpeechRecognition';

class MockSpeechRecognition {
    static instance: MockSpeechRecognition | null = null;

    lang = '';
    continuous = false;
    interimResults = false;
    onresult: ((event: SpeechRecognitionEvent) => void) | null = null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null = null;
    onend: (() => void) | null = null;
    start = vi.fn();
    stop = vi.fn(() => {
        this.onend?.();
    });

    constructor() {
        MockSpeechRecognition.instance = this;
    }
}

const setSpeechRecognition = (value: unknown) => {
    Object.defineProperty(window, 'webkitSpeechRecognition', {
        configurable: true,
        writable: true,
        value,
    });
    Object.defineProperty(window, 'SpeechRecognition', {
        configurable: true,
        writable: true,
        value: undefined,
    });
};

describe('useSpeechRecognition', () => {
    afterEach(() => {
        setSpeechRecognition(undefined);
        MockSpeechRecognition.instance = null;
    });

    it('reports unsupported browsers', () => {
        setSpeechRecognition(undefined);

        const { result } = renderHook(() => useSpeechRecognition());

        expect(result.current.isSupported).toBe(false);
        expect(result.current.status).toBe('unsupported');
        expect(result.current.error).toContain('not supported');
    });

    it('preserves transcript after recording stops', () => {
        setSpeechRecognition(MockSpeechRecognition);

        const { result } = renderHook(() => useSpeechRecognition({ continuous: true }));

        act(() => {
            result.current.start();
        });

        act(() => {
            MockSpeechRecognition.instance?.onresult?.({
                results: [[{ transcript: 'clear explanation' }]],
            } as unknown as SpeechRecognitionEvent);
        });

        act(() => {
            result.current.stop();
        });

        expect(result.current.isListening).toBe(false);
        expect(result.current.transcript).toBe('clear explanation');
    });
});
