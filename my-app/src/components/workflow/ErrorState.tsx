import React from 'react';
import { SessionError } from '../../types/session';

interface ErrorStateProps {
    error: SessionError | null;
    onRetry: () => void;
    onReset: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry, onReset }) => (
    <section className="stage-card center" role="alert">
        <h1>{error?.title || 'Something went wrong'}</h1>
        <p>{error?.message || 'The session could not continue.'}</p>
        <div className="recovery-panel">
            <span className="panel-label">What to try</span>
            <ul>
                {error?.code === 'ollama-unavailable' && (
                    <>
                        <li>Start Ollama locally.</li>
                        <li>Confirm the configured Ollama URL.</li>
                    </>
                )}
                {error?.code === 'model-missing' && (
                    <li>Pull the configured model, then retry this step.</li>
                )}
                {error?.code === 'timeout' && (
                    <>
                        <li>The model may still be loading — wait a moment and retry.</li>
                        <li>Restart Ollama (`ollama serve`) if requests keep stalling.</li>
                    </>
                )}
                {error?.code === 'invalid-response' && (
                    <li>Retry the request, or simplify the explanation and generate again.</li>
                )}
                <li>Your current step stays recoverable from here.</li>
            </ul>
        </div>
        <div className="button-row">
            {error?.recoverable && (
                <button type="button" className="primary-button" onClick={onRetry}>
                    Try Again
                </button>
            )}
            <button type="button" className="secondary-button" onClick={onReset}>
                Start Over
            </button>
        </div>
    </section>
);

export default ErrorState;
