import React, { useState } from 'react';
import ChatInput from './ChatInput.jsx';
import ChatLog from './ChatLog.jsx';

const ChatInterface = ({ chatLog, onSendMessage }) => {
    const [isVoiceMode, setIsVoiceMode] = useState(false);

    const toggleVoiceMode = () => {
        setIsVoiceMode((prev) => !prev);
        // Implement voice recognition logic here
    };

    return (
        <div>
            <ChatInput onSendMessage={onSendMessage} onToggleVoice={toggleVoiceMode} isVoiceMode={isVoiceMode} />
            <ChatLog messages={chatLog} />
        </div>
    );
};

export default ChatInterface;