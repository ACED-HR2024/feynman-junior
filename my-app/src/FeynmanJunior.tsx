import React, { useState } from 'react';
import './FeynmanJunior.css';  // Assuming the CSS for chat-input is defined there

const FeynmanJunior = () => {
    const [audience, setAudience] = useState('');
    const [isTransitioning, setIsTransitioning] = useState(false);
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
            setIsChatFocused(false); // Collapse only if input is empty
        }
    };

    const handleAudienceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setAudience(e.target.value);
        if (e.target.value) {
            setIsTransitioning(true);
            setTimeout(() => setIsTransitioning(false), 500);
        }
    };

    const toggleRecording = () => {
        setIsRecording(!isRecording);
    };

    const handleChatSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log('Submitted message:', chatInput);
        setChatInput('');
    };

    return (
        <div className="feynman-junior-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }}>
            <h2>FeynmanJunior Component</h2>
            <div style={{ transition: 'all 0.5s ease-in-out', opacity: isTransitioning || audience ? 0 : 1, transform: `translateY(${isTransitioning || audience ? '-100%' : '0'})` }}>
                <h1 style={{ fontSize: '24px', color: '#3b82f6', marginBottom: '16px' }}>Feynman Junior</h1>
                <p style={{ fontSize: '18px', color: '#4b5563', marginBottom: '16px' }}>Select your audience:</p>
                <select
                    style={{ width: '256px', padding: '8px', fontSize: '18px', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px' }}
                    value={audience}
                    onChange={handleAudienceChange}
                    aria-label="Select audience"
                >
                    <option value="">Select an audience</option>
                    <option value="elementary">Elementary school kids</option>
                    <option value="middle">Middle school kids</option>
                    <option value="high">High school kids</option>
                    <option value="undergraduate">Undergraduate students</option>
                    <option value="graduate">Graduate students</option>
                    <option value="professionals">Professionals</option>
                </select>
            </div>
            <div style={{ transition: 'all 0.5s ease-in-out', opacity: isTransitioning || !audience ? 0 : 1, transform: `translateY(${isTransitioning || !audience ? '100%' : '0'})` }}>
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
            </div>
        </div>
    );
};

export default FeynmanJunior;
