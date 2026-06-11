import React from 'react';
import { createLogger } from '../../services/logger';

const logger = createLogger('errorBoundary');

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    error: Error | null;
}

/**
 * Catches render-time exceptions anywhere below it so a single thrown error
 * shows a recoverable screen instead of unmounting the whole app to a blank
 * white window. (Renderer-process crashes are handled separately in the
 * Electron main process.)
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo): void {
        logger.error('render error', error, info.componentStack);
    }

    private handleReload = (): void => {
        window.location.reload();
    };

    render(): React.ReactNode {
        if (this.state.error) {
            return (
                <div className="app-shell">
                    <section className="stage-card center" role="alert">
                        <h1>The app hit an unexpected error.</h1>
                        <p>
                            Something in the interface crashed. Reloading usually
                            recovers the session without losing your local setup.
                        </p>
                        <p className="speech-status error">{this.state.error.message}</p>
                        <div className="button-row">
                            <button type="button" className="primary-button" onClick={this.handleReload}>
                                Reload
                            </button>
                        </div>
                    </section>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
