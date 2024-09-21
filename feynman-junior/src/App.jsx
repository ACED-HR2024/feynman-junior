import React, { useState } from 'react';
import AudienceSelect from './components/AudienceSelect.jsx';
import ChatInterface from './components/ChatInterface.jsx';

const App = () => {
    const [selectedAudience, setSelectedAudience] = useState('');
    const [chatLog, setChatLog] = useState([]);

    const handleAudienceChange = (audience) => {
        setSelectedAudience(audience);
    };

    const handleSendMessage = (message) => {
        addMessageToChatLog('user', message);
        // Simulate AI response (replace with actual AI integration)
        setTimeout(() => {
            const aiResponse = `AI response to: "${message}"`;
            addMessageToChatLog('ai', aiResponse);
        }, 1000);
    };

    const addMessageToChatLog = (sender, message) => {
        setChatLog((prevLog) => [...prevLog, { sender, message }]);
    };

    return (
        <div className="container">
            <h1>Feynman Junior</h1>
            <p>Welcome! Please select your audience.</p>
            <AudienceSelect onAudienceChange={handleAudienceChange} />
            {selectedAudience && (
                <ChatInterface
                    chatLog={chatLog}
                    onSendMessage={handleSendMessage}
                />
            )}
        </div>
    );
};

export default App;