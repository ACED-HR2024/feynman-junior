import React, { useState } from 'react';
import AudienceSelect from "./AudienceSelect";

interface LLMInputProps {
    onSubmit: (message: string) => void;
}

const LLMInput: React.FC<LLMInputProps> = ({ onSubmit }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [isChatFocused, setIsChatFocused] = useState(false);

    const handleChatChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setChatInput(e.target.value);
    };

    const handleChatFocus = () => {
        setIsChatFocused(true);
    };

    const handleChatBlur = () => {
        if (chatInput === '') {
            setIsChatFocused(false);
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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button
                style={{
                    padding: '24px',
                    borderRadius: '50%',
                    backgroundColor: isRecording ? '#ef4444' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
                onClick={toggleRecording}
                aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            >
                {isRecording ? 'Stop' : 'Record'}
            </button>
            <form onSubmit={handleChatSubmit} style={{ marginTop: '32px', width: '100%', maxWidth: '400px' }}>
                <div className="input-wrapper">
          <textarea
              value={chatInput}
              onChange={handleChatChange}
              onFocus={handleChatFocus}
              onBlur={handleChatBlur}
              className={`chat-input ${isChatFocused ? 'input-expanded' : 'input-collapsed'}`}
              placeholder="Type your message..."
              aria-describedby="chatInput"
          />
                </div>
            </form>
        </div>
    );
};

export default LLMInput;