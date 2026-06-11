import React, { useEffect, useRef, useState } from 'react';
import { createLogger } from '../../services/logger';
import { notify } from '../../services/toastBus';
import {
    createVoiceTranscriber,
    isVoiceTranscriptionSupported,
    VoiceTranscriberHandle,
} from '../../services/voiceTranscriber';

const logger = createLogger('voiceRecorder');

type RecorderStatus = 'idle' | 'loading' | 'recording' | 'error';

interface VoiceRecorderProps {
    label: string;
    onTranscript: (transcript: string) => void;
    disabled?: boolean;
    idleHint?: string;
}

const formatDuration = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
    label,
    onTranscript,
    disabled = false,
    idleHint = 'Speech is transcribed on-device and stays editable.',
}) => {
    const [status, setStatus] = useState<RecorderStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [interim, setInterim] = useState('');
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const transcriberRef = useRef<VoiceTranscriberHandle | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const isSupported = isVoiceTranscriptionSupported();

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const startTimer = () => {
        setElapsedSeconds(0);
        timerRef.current = setInterval(() => {
            setElapsedSeconds((current) => current + 1);
        }, 1000);
    };

    useEffect(() => () => {
        stopTimer();
        transcriberRef.current?.stop();
    }, []);

    const handleError = (message: string) => {
        stopTimer();
        setInterim('');
        setStatus('error');
        setError(message);
        notify({
            title: 'Voice input failed',
            message: `${message} You can still type below.`,
            tone: 'error',
        });
    };

    const startRecording = async () => {
        if (!isSupported || status === 'recording' || status === 'loading') {
            logger.info('startRecording: ignored', { isSupported, status });
            return;
        }

        logger.info('startRecording: begin');
        setError(null);
        setInterim('');
        setStatus('loading');

        try {
            if (!transcriberRef.current) {
                logger.info('startRecording: creating transcriber (first use)');
                transcriberRef.current = await createVoiceTranscriber({
                    onTranscribeStarted: () => {
                        startTimer();
                        setStatus('recording');
                    },
                    onTranscriptionUpdated: (text) => setInterim(text),
                    onTranscriptionCommitted: (text) => {
                        setInterim('');
                        onTranscript(text);
                    },
                    onError: handleError,
                });
                logger.info('startRecording: transcriber created');
            }

            logger.info('startRecording: calling transcriber.start()');
            await transcriberRef.current.start();
            logger.info('startRecording: transcriber.start() returned');
        } catch (recordingError) {
            logger.error('startRecording: failed', recordingError);
            handleError(recordingError instanceof Error
                ? recordingError.message
                : 'Unable to start voice input.');
        }
    };

    const stopRecording = () => {
        stopTimer();
        setInterim('');
        transcriberRef.current?.stop();
        setStatus('idle');
    };

    const handleToggle = () => {
        if (status === 'recording') {
            stopRecording();
            return;
        }

        void startRecording();
    };

    if (!isSupported) {
        return (
            <p className="speech-status error" role="status">
                Voice input is unavailable because this device cannot capture or
                process audio locally.
            </p>
        );
    }

    return (
        <div className="voice-recorder">
            <button
                type="button"
                className={`record-button ${status === 'recording' ? 'recording' : ''}`}
                onClick={handleToggle}
                disabled={disabled || status === 'loading'}
            >
                <span className="record-dot" aria-hidden="true" />
                {status === 'recording' && `Stop · ${formatDuration(elapsedSeconds)}`}
                {status === 'loading' && 'Loading model...'}
                {(status === 'idle' || status === 'error') && label}
            </button>
            <p className={`speech-status ${status === 'error' ? 'error' : ''}`} role="status">
                {status === 'recording' && (interim
                    ? `“${interim}”`
                    : 'Listening. Stop when you finish your thought.')}
                {status === 'loading' && 'Preparing the on-device speech model (first run downloads it once)...'}
                {status === 'idle' && idleHint}
                {status === 'error' && error}
            </p>
        </div>
    );
};

export default VoiceRecorder;
