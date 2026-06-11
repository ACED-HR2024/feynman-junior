import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import ErrorBoundary from './components/feedback/ErrorBoundary';
import { createLogger } from './services/logger';
import reportWebVitals from './reportWebVitals';

const bootLogger = createLogger('renderer');
bootLogger.info('renderer boot', {
    userAgent: navigator.userAgent,
    crossOriginIsolated: typeof crossOriginIsolated !== 'undefined' ? crossOriginIsolated : 'undefined',
    hasSharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
});

window.addEventListener('error', (event) => {
    bootLogger.error('window.onerror', {
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        error: event.error,
    });
});

window.addEventListener('unhandledrejection', (event) => {
    bootLogger.error('unhandledrejection', event.reason);
});

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);
root.render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>
);

reportWebVitals();