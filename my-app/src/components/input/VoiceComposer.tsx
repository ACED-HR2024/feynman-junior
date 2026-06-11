import React, { useState } from 'react';
import VoiceRecorder from './VoiceRecorder';

interface VoiceComposerProps {
    onSubmit: (topic: string, explanation: string) => void;
    disabled?: boolean;
    initialTopic?: string;
    initialExplanation?: string;
}

const VoiceComposer: React.FC<VoiceComposerProps> = ({
    onSubmit,
    disabled = false,
    initialTopic = '',
    initialExplanation = '',
}) => {
    const [topic, setTopic] = useState(initialTopic);
    const [explanation, setExplanation] = useState(initialExplanation);

    const appendTranscript = (transcript: string) => {
        setExplanation((current) => (
            current.trim()
                ? `${current.trim()} ${transcript}`
                : transcript
        ));
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!explanation.trim()) {
            return;
        }

        onSubmit(topic.trim(), explanation.trim());
    };

    return (
        <form className="composer" onSubmit={handleSubmit}>
            <div className="field-group">
                <label className="field-label" htmlFor="topic">
                    Topic <span>optional, but helps the questions focus</span>
                </label>
                <input
                    id="topic"
                    className="text-input"
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    placeholder="e.g. gravity, recursion, compound interest"
                    disabled={disabled}
                />
            </div>

            <div className="voice-panel">
                <div>
                    <span className="panel-label">Speak your explanation</span>
                    <p className="speech-status">
                        Teach it out loud the way you would to a real person.
                        Each take is transcribed and appended below.
                    </p>
                </div>
                <VoiceRecorder
                    label="Record Explanation"
                    onTranscript={appendTranscript}
                    disabled={disabled}
                />
            </div>

            <div className="field-group">
                <label className="field-label" htmlFor="explanation">
                    Transcript <span>edit anything the transcription got wrong</span>
                </label>
                <textarea
                    id="explanation"
                    className="chat-input"
                    value={explanation}
                    onChange={(event) => setExplanation(event.target.value)}
                    placeholder="Record above and your spoken explanation lands here, ready to tidy up before the audience challenges it."
                    rows={7}
                    disabled={disabled}
                />
                {!explanation.trim() && (
                    <p className="field-help">
                        Record an explanation before generating audience questions.
                    </p>
                )}
            </div>

            <button
                type="submit"
                className="primary-button"
                disabled={disabled || !explanation.trim()}
            >
                Generate Questions
            </button>
        </form>
    );
};

export default VoiceComposer;
