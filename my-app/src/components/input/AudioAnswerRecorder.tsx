import React, { useRef, useState } from 'react';
import { transcriptionClient } from '../../services/transcriptionClient';

type RecorderStatus = 'idle' | 'recording' | 'transcribing' | 'error';

interface AudioAnswerRecorderProps {
    onTranscriptReady: (transcript: string) => void;
}

const AudioAnswerRecorder: React.FC<AudioAnswerRecorderProps> = ({ onTranscriptReady }) => {
    const [status, setStatus] = useState<RecorderStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);

    const isSupported = Boolean(
        navigator.mediaDevices?.getUserMedia &&
        typeof MediaRecorder !== 'undefined',
    );

    const stopStream = () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
    };

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
                setStatus('transcribing');
                stopStream();

                try {
                    const audio = new Blob(chunksRef.current, {
                        type: recorder.mimeType || 'audio/webm',
                    });
                    const transcript = await transcriptionClient.transcribeAudio(audio);

                    if (transcript.trim()) {
                        onTranscriptReady(transcript.trim());
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
            setStatus('recording');
        } catch (recordingError) {
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

    if (!isSupported) {
        return (
            <p className="speech-status">
                Verbal answers are unavailable because this device cannot record audio.
            </p>
        );
    }

    return (
        <div className="audio-answer-recorder">
            <div className="button-row">
                {status === 'recording' ? (
                    <button type="button" className="secondary-button" onClick={stopRecording}>
                        Stop Verbal Answer
                    </button>
                ) : (
                    <button
                        type="button"
                        className="secondary-button"
                        onClick={startRecording}
                        disabled={status === 'transcribing'}
                    >
                        {status === 'transcribing' ? 'Transcribing...' : 'Record Verbal Answer'}
                    </button>
                )}
            </div>
            <p className={`speech-status ${status === 'error' ? 'error' : ''}`}>
                {status === 'recording' && 'Recording your answer.'}
                {status === 'transcribing' && 'Sending audio to the transcription adapter.'}
                {status === 'idle' && 'Speak an answer, then review the transcript before feedback.'}
                {status === 'error' && error}
            </p>
        </div>
    );
};

export default AudioAnswerRecorder;
