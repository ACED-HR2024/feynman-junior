import React, { useState } from 'react';

const ChatInput = ({ onSendMessage, onToggleVoice, isVoiceMode }) => {
    const [inputValue, setInputValue] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();
        if (inputValue.trim()) {
            onSendMessage(inputValue.trim());
            setInputValue('');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
            />
            <button type="submit">Send</button>
            <button type="button" onClick={onToggleVoice}>
                {isVoiceMode ? '🔴 Recording' : '🎤'}
            </button>
        </form>
    );
};

export default ChatInput;
