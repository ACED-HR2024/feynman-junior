import React from 'react';

const ChatLog = ({ messages }) => {
    return (
        <div className="chat-log">
            {messages.map((message, index) => (
                <p key={index} className={`${message.sender}-message`}>
                    {message.message}
                </p>
            ))}
        </div>
    );
};

export default ChatLog;