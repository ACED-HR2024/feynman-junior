import React from 'react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

interface SpeechRecorderProps {
    onTranscriptReady: (transcript: string) => void;
}

const SpeechRecorder: React.FC<SpeechRecorderProps> = ({ onTranscriptReady }) => {
    const {
        isSupported,
        isListening,
        transcript,
        error,
        start,
        stop,
        resetTranscript,
    } = useSpeechRecognition({ continuous: true });

    const handleToggleRecording = () => {
        if (isListening) {
            stop();
            if (transcript.trim()) {
                onTranscriptReady(transcript.trim());
            }
            return;
        }

        resetTranscript();
        start();
    };

    if (!isSupported) {
        return (
            <div className="speech-status" role="status">
                Speech input is not supported in this browser. You can still type your explanation.
            </div>
        );
    }

    return (
        <div className="speech-recorder">
            <button
                type="button"
                className={`microphone-button ${isListening ? 'active' : ''}`}
                onClick={handleToggleRecording}
                aria-label={isListening ? 'Stop recording' : 'Start recording'}
            >
                Mic
            </button>
            {error && <p className="speech-status error">{error}</p>}
            <p className="speech-status">
                {isListening ? `Listening: ${transcript || 'Start speaking...'}` : 'Speech input ready.'}
            </p>
        </div>
    );
};

export default SpeechRecorder;
