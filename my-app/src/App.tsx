import React, { useState } from 'react';
import './App.css';
import AudienceSelect from './functions/AudienceSelect';
import LLMInput from './functions/LLMInput';

function App() {
    const [audience, setAudience] = useState('');
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [inputValue, setInputValue] = useState<string>('');

    const handleAudienceChange = (newAudience: string) => {
        setAudience(newAudience);
        if (newAudience) {
            setIsTransitioning(true);
            setTimeout(() => setIsTransitioning(false), 500);
        }
    };

    const handleLLMSubmit = (message: string) => {
        console.log('Submitted message:', message);
        setInputValue(message);
        // Here you would typically send the message to your LLM
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        console.log(inputValue);
    };

    return (
        <div className="app-container">
            <h1>Feynman Junior App</h1>
            <div style={{
                transition: 'all 0.5s ease-in-out',
                opacity: isTransitioning || audience ? 0 : 1,
                transform: `translateY(${isTransitioning || audience ? '-100%' : '0'})`
            }}>
                <AudienceSelect audience={audience} onAudienceChange={handleAudienceChange} />
            </div>
            <div style={{
                transition: 'all 0.5s ease-in-out',
                opacity: isTransitioning || !audience ? 0 : 1,
                transform: `translateY(${isTransitioning || !audience ? '100%' : '0'})`
            }}>
                <LLMInput onSubmit={handleLLMSubmit} />
            </div>
        </div>
    );
}

export default App;