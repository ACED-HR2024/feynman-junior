import React, { useEffect, useState } from 'react';
import './App.css';
import AudienceSelect from './functions/AudienceSelect';
import MiddleScreen from './functions/MiddleScreen';
import LLMInput from './functions/LLMInput';
import { ollamaService } from './ollama_service/ollama_service';

function App() {
    const [audience, setAudience] = useState('');
    const [stage, setStage] = useState<'select' | 'priming' | 'input'>('select');
    const [inputValue, setInputValue] = useState<string>('');
    const [ollamaResponse, setOllamaResponse] = useState<string>('');

    const handleAudienceChange = (newAudience: string) => {
        setAudience(newAudience);
        if (newAudience) {
            setStage('priming');
        }
    };

    useEffect(() => {
        if (audience && stage === 'priming') {
            const primePrompt = `You are ${audience}. After reading the presentation you will ask 4 questions about the presentation topic as a ${audience}. The younger, the more inquisitive your questions.`;

            ollamaService.primeOllama(primePrompt)
                .then(() => {
                    console.log(`Ollama primed with audience ${audience}`);
                    setStage('input');
                })
                .catch((error) => {
                    console.error(`Error priming Ollama:`, error);
                    setStage('select'); // Go back to select if there's an error
                });
        }
    }, [audience, stage]);

    const handleLLMSubmit = async (message: string) => {
        try {
            console.log('Submitted message', message);
            setInputValue(message);

            const response = await ollamaService.sendMessage(message);
            console.log('LLM Response', response);
            setOllamaResponse(response);
        } catch (error) {
            console.error('Error from LLM', error);
            setOllamaResponse('Error: Unable to get response from Ollama');
        }
    };

    return (
        <div className="app-container">
            <div className={`screen ${stage === 'select' ? 'active' : ''}`}>
                <AudienceSelect audience={audience} onAudienceChange={handleAudienceChange} disabled={stage !== 'select'}/>
            </div>
            <div className={`screen ${stage === 'priming' ? 'active' : ''}`}>
                <MiddleScreen audience={audience} />
            </div>
            <div className={`screen ${stage === 'input' ? 'active' : ''}`}>
                <LLMInput onSubmit={handleLLMSubmit} />
                {ollamaResponse && (
                    <div className="ollama-response">
                        <h3>Ollama Response:</h3>
                        <p>{ollamaResponse}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;