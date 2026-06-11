import React, { useEffect, useRef, useState } from 'react';
import { transcriptionClient } from '../../services/transcriptionClient';

type RecorderStatus = 'idle' | 'recording' | 'transcribing' | 'error';

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
    idleHint = 'Recordings are transcribed locally and stay editable.',
}) => {
    const [status, setStatus] = useState<RecorderStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const isSupported = (
        typeof navigator.mediaDevices?.getUserMedia === 'function' &&
        typeof MediaRecorder !== 'undefined'
    );

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const stopStream = () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
    };

    useEffect(() => () => {
        stopTimer();
        stopStream();
    }, []);

    const startRecording = async () => {
        if (!isSupported || status === 'recording') {
            return;
        }

        try {
            setError(null);
            chunksRef.current = [];
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);

            streamRef.current = stream;
            recorderRef.current = recorder;
            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };
            recorder.onstop = async () => {
                stopTimer();
                stopStream();
                setStatus('transcribing');

                try {
                    const audio = new Blob(chunksRef.current, {
                        type: recorder.mimeType || 'audio/webm',
                    });
                    const transcript = await transcriptionClient.transcribeAudio(audio);

                    if (transcript.trim()) {
                        onTranscript(transcript.trim());
                    }

                    setStatus('idle');
                } catch (transcriptionError) {
                    setStatus('error');
                    setError(transcriptionError instanceof Error
                        ? transcriptionError.message
                        : 'Unable to transcribe this recording.');
                }
            };

            recorder.start();
            setElapsedSeconds(0);
            timerRef.current = setInterval(() => {
                setElapsedSeconds((current) => current + 1);
            }, 1000);
            setStatus('recording');
        } catch (recordingError) {
            stopTimer();
            stopStream();
            setStatus('error');
            setError(recordingError instanceof Error
                ? recordingError.message
                : 'Unable to start recording.');
        }
    };

    const stopRecording = () => {
        if (recorderRef.current?.state === 'recording') {
            recorderRef.current.stop();
        }
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
                Voice input is unavailable because this device cannot record audio.
            </p>
        );
    }

    return (
        <div className="voice-recorder">
            <button
                type="button"
                className={`record-button ${status === 'recording' ? 'recording' : ''}`}
                onClick={handleToggle}
                disabled={disabled || status === 'transcribing'}
            >
                <span className="record-dot" aria-hidden="true" />
                {status === 'recording' && `Stop · ${formatDuration(elapsedSeconds)}`}
                {status === 'transcribing' && 'Transcribing...'}
                {(status === 'idle' || status === 'error') && label}
            </button>
            <p className={`speech-status ${status === 'error' ? 'error' : ''}`} role="status">
                {status === 'recording' && 'Listening. Stop when you finish your thought.'}
                {status === 'transcribing' && 'Turning your recording into text...'}
                {status === 'idle' && idleHint}
                {status === 'error' && error}
            </p>
        </div>
    );
};

export default VoiceRecorder;
