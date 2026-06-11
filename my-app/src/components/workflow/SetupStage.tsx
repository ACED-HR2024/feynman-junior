import React, { useCallback, useEffect, useRef, useState } from 'react';
import { desktopConfigClient } from '../../services/desktopConfigClient';
import { ModelPullProgress } from '../../services/ollamaSetupService';
import { setupClient } from '../../services/setupClient';
import { isSetupReady, SetupStatus } from '../../services/setupStatus';

interface SetupStageProps {
    initialStatus?: SetupStatus | null;
    onComplete: (status: SetupStatus) => void;
}

interface PullState {
    active: boolean;
    progress: ModelPullProgress | null;
    error: string | null;
}

const IDLE_PULL: PullState = { active: false, progress: null, error: null };

const formatBytes = (bytes?: number): string => {
    if (!bytes || bytes <= 0) {
        return '';
    }

    const gigabytes = bytes / (1024 ** 3);

    if (gigabytes >= 1) {
        return `${gigabytes.toFixed(1)} GB`;
    }

    return `${Math.round(bytes / (1024 ** 2))} MB`;
};

const StatusPill: React.FC<{ ok: boolean; okLabel: string; failLabel: string }> = ({
    ok,
    okLabel,
    failLabel,
}) => (
    <span className={`status-pill ${ok ? 'ok' : 'warn'}`}>
        {ok ? okLabel : failLabel}
    </span>
);

const SetupStage: React.FC<SetupStageProps> = ({ initialStatus = null, onComplete }) => {
    const [status, setStatus] = useState<SetupStatus | null>(initialStatus);
    const [isChecking, setIsChecking] = useState(false);
    const [isSeeded, setIsSeeded] = useState(false);
    const [ollamaUrlDraft, setOllamaUrlDraft] = useState('');
    const [modelDraft, setModelDraft] = useState('');
    const [voiceUrlDraft, setVoiceUrlDraft] = useState('');
    const [voiceModelDraft, setVoiceModelDraft] = useState('');
    const [pull, setPull] = useState<PullState>(IDLE_PULL);
    const cancelRequested = useRef(false);

    const refresh = useCallback(async (): Promise<SetupStatus> => {
        setIsChecking(true);

        try {
            const next = await setupClient.getStatus();
            setStatus(next);
            return next;
        } finally {
            setIsChecking(false);
        }
    }, []);

    useEffect(() => {
        if (!initialStatus) {
            void refresh();
        }
    }, [initialStatus, refresh]);

    useEffect(() => {
        if (status && !isSeeded) {
            setOllamaUrlDraft(status.ollama.baseUrl);
            setModelDraft(status.model.configured);
            setVoiceUrlDraft(status.transcription.baseUrl);
            setVoiceModelDraft(status.transcription.model);
            setIsSeeded(true);
        }
    }, [status, isSeeded]);

    const applyOllamaSettings = async () => {
        await desktopConfigClient.setOllamaConfig({
            baseUrl: ollamaUrlDraft.trim() || status?.ollama.baseUrl,
            model: modelDraft.trim() || status?.model.configured,
        });
        await refresh();
    };

    const applyVoiceSettings = async () => {
        await desktopConfigClient.setTranscriptionConfig({
            baseUrl: voiceUrlDraft.trim() || status?.transcription.baseUrl,
            model: voiceModelDraft.trim() || status?.transcription.model,
        });
        await refresh();
    };

    const selectInstalledModel = async (modelName: string) => {
        setModelDraft(modelName);
        await desktopConfigClient.setOllamaConfig({ model: modelName });
        await refresh();
    };

    const downloadConfiguredModel = async () => {
        const model = modelDraft.trim() || status?.model.configured;

        if (!model || pull.active) {
            return;
        }

        cancelRequested.current = false;
        setPull({ active: true, progress: null, error: null });

        try {
            await desktopConfigClient.setOllamaConfig({ model });
            await setupClient.pullModel(model, (progress) => {
                setPull((current) => ({ ...current, progress }));
            });
            setPull(IDLE_PULL);
        } catch (error) {
            setPull({
                active: false,
                progress: null,
                error: cancelRequested.current
                    ? null
                    : (error instanceof Error ? error.message : 'The download failed.'),
            });
        }

        await refresh();
    };

    const cancelDownload = () => {
        cancelRequested.current = true;
        void setupClient.cancelModelPull();
    };

    const handleStart = () => {
        if (status && isSetupReady(status)) {
            onComplete(status);
        }
    };

    if (!status) {
        return (
            <section className="stage-card center">
                <div className="loading-spinner" aria-hidden="true" />
                <h2>Checking your local AI setup...</h2>
                <p>Looking for Ollama and a transcription server on this machine.</p>
            </section>
        );
    }

    const ready = isSetupReady(status);
    const percent = pull.progress?.total
        ? Math.min(100, Math.round(((pull.progress.completed || 0) / pull.progress.total) * 100))
        : null;

    return (
        <section className="stage-card setup-card">
            <div className="stage-intro">
                <span className="eyebrow">Setup · Local AI</span>
                <h1>Connect your local models.</h1>
                <p>
                    Feynman Junior runs entirely on your machine: Ollama plays your
                    audience, and a local transcription server turns your voice into
                    text. Nothing you say or write leaves this computer.
                </p>
            </div>

            <section className="setup-section">
                <header className="setup-section-header">
                    <div>
                        <h2>Ollama</h2>
                        <p className="setup-hint">
                            Required. Generates the audience questions and feedback.
                        </p>
                    </div>
                    <StatusPill
                        ok={status.ollama.reachable}
                        okLabel="Running"
                        failLabel="Not running"
                    />
                </header>

                {!status.ollama.reachable && (
                    <div className="setup-callout">
                        <p>{status.ollama.message}</p>
                        <ol>
                            <li>
                                Install Ollama from{' '}
                                <a href="https://ollama.com/download" target="_blank" rel="noreferrer">
                                    ollama.com/download
                                </a>{' '}
                                if you have not already.
                            </li>
                            <li>Start it by opening the Ollama app or running <code>ollama serve</code>.</li>
                            <li>Click Check Again below.</li>
                        </ol>
                    </div>
                )}

                <div className="setup-row">
                    <div className="field-group">
                        <label className="field-label" htmlFor="setup-ollama-url">Server URL</label>
                        <input
                            id="setup-ollama-url"
                            className="text-input"
                            value={ollamaUrlDraft}
                            onChange={(event) => setOllamaUrlDraft(event.target.value)}
                            placeholder="http://localhost:11434"
                        />
                    </div>
                    <div className="field-group">
                        <label className="field-label" htmlFor="setup-ollama-model">Model</label>
                        <input
                            id="setup-ollama-model"
                            className="text-input"
                            value={modelDraft}
                            onChange={(event) => setModelDraft(event.target.value)}
                            placeholder="phi4-mini"
                        />
                    </div>
                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() => void applyOllamaSettings()}
                        disabled={isChecking || pull.active}
                    >
                        Apply
                    </button>
                </div>

                {status.ollama.reachable && status.ollama.models.length > 0 && (
                    <div className="field-group">
                        <span className="field-label">
                            Installed models <span>click one to use it</span>
                        </span>
                        <div className="model-chips">
                            {status.ollama.models.map((model) => {
                                const isActive = model.name === status.model.configured ||
                                    model.name.startsWith(`${status.model.configured}:`);
                                const size = formatBytes(model.sizeBytes);

                                return (
                                    <button
                                        type="button"
                                        key={model.name}
                                        className={`model-chip ${isActive ? 'selected' : ''}`}
                                        onClick={() => void selectInstalledModel(model.name)}
                                        disabled={pull.active}
                                    >
                                        {model.name}
                                        {size && <span>{size}</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {status.ollama.reachable && !status.model.available && !pull.active && (
                    <div className="setup-callout">
                        <p>
                            The configured model <code>{status.model.configured}</code> is
                            not installed yet. Download it once and Feynman Junior is
                            ready to practice offline.
                        </p>
                        <div className="button-row">
                            <button
                                type="button"
                                className="primary-button"
                                onClick={() => void downloadConfiguredModel()}
                            >
                                Download {modelDraft.trim() || status.model.configured}
                            </button>
                        </div>
                        {pull.error && <p className="speech-status error">{pull.error}</p>}
                    </div>
                )}

                {pull.active && (
                    <div className="setup-callout">
                        <p>
                            Downloading <code>{pull.progress?.model || modelDraft}</code>
                            {percent !== null ? ` · ${percent}%` : ''}
                            {pull.progress?.status ? ` (${pull.progress.status})` : ''}
                        </p>
                        <div
                            className="progress-track"
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={percent ?? undefined}
                        >
                            <div
                                className={`progress-fill ${percent === null ? 'indeterminate' : ''}`}
                                style={percent !== null ? { width: `${percent}%` } : undefined}
                            />
                        </div>
                        <div className="button-row">
                            <button type="button" className="secondary-button" onClick={cancelDownload}>
                                Cancel Download
                            </button>
                        </div>
                    </div>
                )}
            </section>

            <section className="setup-section">
                <header className="setup-section-header">
                    <div>
                        <h2>Voice transcription</h2>
                        <p className="setup-hint">
                            Recommended. Turns your spoken explanations and answers into
                            text. Works with any OpenAI-compatible server, such as
                            Speaches, faster-whisper-server, or LM Studio.
                        </p>
                    </div>
                    <StatusPill
                        ok={status.transcription.reachable}
                        okLabel="Reachable"
                        failLabel="Not found"
                    />
                </header>

                {!status.transcription.reachable && (
                    <p className="setup-hint">
                        {status.transcription.message} You can still practice by typing;
                        voice recording will show an error until a server is available.
                    </p>
                )}

                <div className="setup-row">
                    <div className="field-group">
                        <label className="field-label" htmlFor="setup-voice-url">Server URL</label>
                        <input
                            id="setup-voice-url"
                            className="text-input"
                            value={voiceUrlDraft}
                            onChange={(event) => setVoiceUrlDraft(event.target.value)}
                            placeholder="http://localhost:8000"
                        />
                    </div>
                    <div className="field-group">
                        <label className="field-label" htmlFor="setup-voice-model">Model</label>
                        <input
                            id="setup-voice-model"
                            className="text-input"
                            value={voiceModelDraft}
                            onChange={(event) => setVoiceModelDraft(event.target.value)}
                            placeholder="whisper-1"
                        />
                    </div>
                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() => void applyVoiceSettings()}
                        disabled={isChecking}
                    >
                        Apply
                    </button>
                </div>
            </section>

            <div className="setup-footer">
                <button
                    type="button"
                    className="secondary-button"
                    onClick={() => void refresh()}
                    disabled={isChecking}
                >
                    {isChecking ? 'Checking...' : 'Check Again'}
                </button>
                <button
                    type="button"
                    className="primary-button"
                    onClick={handleStart}
                    disabled={!ready}
                >
                    Start Learning
                </button>
            </div>
            {!ready && (
                <p className="field-help setup-footer-hint">
                    Start Learning unlocks once Ollama is running and the selected
                    model is installed.
                </p>
            )}
        </section>
    );
};

export default SetupStage;
