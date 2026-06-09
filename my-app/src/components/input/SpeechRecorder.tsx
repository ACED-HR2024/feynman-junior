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
                Speech input is not supported in this browser. Typing still works normally.
            </div>
        );
    }

    return (
        <div className="speech-recorder">
            <div>
                <span className="panel-label">Speech input</span>
                <p className="speech-status">
                    {isListening ? `Listening: ${transcript || 'Start speaking...'}` : 'Ready to append a spoken transcript to your explanation.'}
                </p>
            </div>
            <div className="button-row">
                <button
                    type="button"
                    className={`microphone-button ${isListening ? 'active' : ''}`}
                    onClick={handleToggleRecording}
                    aria-label={isListening ? 'Stop recording' : 'Start recording'}
                >
                    {isListening ? 'Stop Recording' : 'Start Recording'}
                </button>
                {transcript && !isListening && (
                    <button type="button" className="secondary-button" onClick={resetTranscript}>
                        Reset Transcript
                    </button>
                )}
            </div>
            {error && <p className="speech-status error">{error}</p>}
        </div>
    );
};

export default SpeechRecorder;
