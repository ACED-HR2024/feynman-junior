import React, { useState } from 'react';
import SpeechRecorder from './SpeechRecorder';

interface TextComposerProps {
    onSubmit: (topic: string, explanation: string) => void;
    disabled?: boolean;
}

const TextComposer: React.FC<TextComposerProps> = ({ onSubmit, disabled = false }) => {
    const [topic, setTopic] = useState('');
    const [explanation, setExplanation] = useState('');

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
            <label className="field-label" htmlFor="topic">
                Topic
            </label>
            <input
                id="topic"
                className="text-input"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="What are you explaining?"
                disabled={disabled}
            />

            <label className="field-label" htmlFor="explanation">
                Explanation
            </label>
            <textarea
                id="explanation"
                className="chat-input"
                value={explanation}
                onChange={(event) => setExplanation(event.target.value)}
                placeholder="Explain the idea as clearly as you can..."
                rows={8}
                disabled={disabled}
            />

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
