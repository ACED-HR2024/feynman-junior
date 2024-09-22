import React, { useEffect, useRef, useState } from 'react';
import './LLMInput.css';
import useSpeechRecognition from './useSpeechRecognition';

interface LLMInputProps {
    onSubmit: (message: string) => void;
}

const LLMInput: React.FC<LLMInputProps> = ({ onSubmit }) => {
    const [isInputExpanded, setIsInputExpanded] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const inputWrapperRef = useRef<HTMLDivElement>(null);
    const [textInput, setTextInput] = useState('');
    const ansRef = useRef('');

    const { isListening, transcript, startListening, stopListening } = useSpeechRecognition({ continuous: true });

    const toggleRecording = () => {
        if (isListening) {
            stopListening();
            // Append the transcript to textInput
            setTextInput(prev => prev + (prev.length && transcript.length ? ' ' : '') + transcript);
            ansRef.current += (ansRef.current.length && transcript.length ? ' ' : '') + transcript;
        } else {
            startListening();
        }
    };

    const handleTextInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTextInput(e.target.value);
        ansRef.current = e.target.value;
    };

    const handleInputFocus = () => {
        if (inputWrapperRef.current) {
            inputWrapperRef.current.classList.add('expanding-width');
            setTimeout(() => {
                if (inputWrapperRef.current) {
                    inputWrapperRef.current.classList.remove('expanding-width');
                    inputWrapperRef.current.classList.add('expanding-height');
                }
            }, 300);
        }
        setIsInputExpanded(true);
    };

    const handleInputBlur = () => {
        if (textInput === '') {
            setIsInputExpanded(false);
            if (inputWrapperRef.current) {
                inputWrapperRef.current.classList.remove('expanding-height');
            }
        }
    };

    const handleChatSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSubmit(textInput);
        setTextInput('');
        ansRef.current = '';
    };

    useEffect(() => {
        if (isInputExpanded && inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
        }
    }, [textInput, isInputExpanded]);

    return (
        <div className="input-container">
            <button
                className={`microphone-button ${isListening ? 'active' : ''}`}
                onClick={toggleRecording}
                aria-label={isListening ? 'Stop recording' : 'Start recording'}
            >
                {isListening ? "Stop Listening" : "Speak"}
            </button>
            <form onSubmit={handleChatSubmit}>
                <div
                    className={`input-wrapper ${isInputExpanded ? 'input-expanded' : ''}`}
                    ref={inputWrapperRef}
                >
                    <textarea
                        ref={inputRef}
                        value={textInput}
                        onChange={handleTextInputChange}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        className="chat-input"
                        placeholder="Type your message..."
                        rows={isInputExpanded ? 3 : 1}
                    />
                    <button type="submit" className="submit-button" aria-label="Submit">
                        ↑
                    </button>
                </div>
            </form>
            <div>
                <h3>Current Speech Input:</h3>
                <p>{isListening ? transcript : 'Not listening'}</p>
            </div>
            <div>
                <h3>Stored Speech:</h3>
                <p>{ansRef.current}</p>
            </div>
        </div>
    );
};

export default LLMInput;