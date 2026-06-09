import React, { useState } from 'react';
import SpeechRecorder from './SpeechRecorder';

interface TextComposerProps {
    onSubmit: (topic: string, explanation: string) => void;
    disabled?: boolean;
    initialTopic?: string;
    initialExplanation?: string;
}

const TextComposer: React.FC<TextComposerProps> = ({
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

            <div className="field-group">
                <label className="field-label" htmlFor="explanation">
                    Explanation <span>write as if you are teaching out loud</span>
                </label>
                <textarea
                    id="explanation"
                    className="chat-input"
                    value={explanation}
                    onChange={(event) => setExplanation(event.target.value)}
                    placeholder="Explain the idea plainly. Use examples, cause and effect, and where people usually get confused."
                    rows={9}
                    disabled={disabled}
                />
                {!explanation.trim() && (
                    <p className="field-help">
                        Feynman Junior needs an explanation before it can ask useful audience questions.
                    </p>
                )}
            </div>

            <SpeechRecorder onTranscriptReady={appendTranscript} />

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

export default TextComposer;
