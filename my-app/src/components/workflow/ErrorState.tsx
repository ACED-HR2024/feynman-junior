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
