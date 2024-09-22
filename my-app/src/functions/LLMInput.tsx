import React, {useEffect, useRef, useState} from 'react';
import './LLMInput.css'; // Make sure to import the CSS file

interface LLMInputProps {
    onSubmit: (message: string) => void;
}

const LLMInput: React.FC<LLMInputProps> = ({onSubmit}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [isInputExpanded, setIsInputExpanded] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const inputWrapperRef = useRef<HTMLDivElement>(null);

    const handleChatChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setChatInput(e.target.value);
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
        if (chatInput === '') {
            setIsInputExpanded(false);
            if (inputWrapperRef.current) {
                inputWrapperRef.current.classList.remove('expanding-height');
            }
        }
    };

    const toggleRecording = () => {
        setIsRecording(!isRecording);
    };

    const handleChatSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSubmit(chatInput);
        setChatInput('');
    };

    useEffect(() => {
        if (isInputExpanded && inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
        }
    }, [chatInput, isInputExpanded]);

    return (
        <div className="input-container">
            <button
                className={`microphone-button ${isRecording ? 'active' : ''}`}
                onClick={toggleRecording}
                aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            >
                🎤
            </button>
            <form onSubmit={handleChatSubmit}>
                <div
                    className={`input-wrapper ${isInputExpanded ? 'input-expanded' : ''}`}
                    ref={inputWrapperRef}
                >
                    <textarea
                        ref={inputRef}
                        value={chatInput}
                        onChange={handleChatChange}
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
        </div>
    );
};

export default LLMInput;