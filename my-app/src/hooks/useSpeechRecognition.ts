import { useCallback, useEffect, useRef, useState } from 'react';

interface BrowserSpeechRecognition {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
    onerror: ((event: { error: string }) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
}

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

type SpeechWindow = Window & typeof globalThis & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export type SpeechRecognitionStatus = 'unsupported' | 'idle' | 'listening' | 'error';

export interface SpeechRecognitionOptions {
    language?: string;
    continuous?: boolean;
    interimResults?: boolean;
}

export interface SpeechRecognitionState {
    isSupported: boolean;
    isListening: boolean;
    status: SpeechRecognitionStatus;
    transcript: string;
    error: string | null;
    start: () => void;
    stop: () => void;
    resetTranscript: () => void;
}

const getSpeechRecognitionConstructor = (): SpeechRecognitionConstructor | undefined => {
    const speechWindow = window as SpeechWindow;
    return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
};

export const useSpeechRecognition = ({
    language = 'en-US',
    continuous = false,
    interimResults = true,
}: SpeechRecognitionOptions = {}): SpeechRecognitionState => {
    const [transcript, setTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSupported, setIsSupported] = useState(true);
    const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

    useEffect(() => {
        const SpeechRecognitionConstructor = getSpeechRecognitionConstructor();

        if (!SpeechRecognitionConstructor) {
            setIsSupported(false);
            setError('Speech recognition is not supported in this browser.');
            return;
        }

        const recognition = new SpeechRecognitionConstructor();
        recognition.lang = language;
        recognition.continuous = continuous;
        recognition.interimResults = interimResults;

        recognition.onresult = (event) => {
            let text = '';
            for (let index = 0; index < event.results.length; index += 1) {
                text += event.results[index][0].transcript;
            }
            setTranscript(text.trim());
        };

        recognition.onerror = (event) => {
            setIsListening(false);
            setError(event.error === 'not-allowed'
                ? 'Microphone permission was denied.'
                : `Speech recognition error: ${event.error}`);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.stop();
            recognitionRef.current = null;
        };
    }, [continuous, interimResults, language]);

    const start = useCallback(() => {
        if (!recognitionRef.current || isListening) {
            return;
        }

        setError(null);
        recognitionRef.current.start();
        setIsListening(true);
    }, [isListening]);

    const stop = useCallback(() => {
        if (!recognitionRef.current || !isListening) {
            return;
        }

        recognitionRef.current.stop();
        setIsListening(false);
    }, [isListening]);

    const resetTranscript = useCallback(() => {
        setTranscript('');
    }, []);

    return {
        isSupported,
        isListening,
        status: !isSupported ? 'unsupported' : error ? 'error' : isListening ? 'listening' : 'idle',
        transcript,
        error,
        start,
        stop,
        resetTranscript,
    };
};
