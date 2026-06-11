import './App.css';
import { useEffect, useState } from 'react';
import AnswerStage from './components/workflow/AnswerStage';
import AudienceStage from './components/workflow/AudienceStage';
import ErrorState from './components/workflow/ErrorState';
import ExplanationStage from './components/workflow/ExplanationStage';
import FeedbackStage from './components/workflow/FeedbackStage';
import PrimingStage from './components/workflow/PrimingStage';
import QuestionStage from './components/workflow/QuestionStage';
import SetupStage from './components/workflow/SetupStage';
import { setupClient } from './services/setupClient';
import { isSetupReady, SetupStatus } from './services/setupStatus';
import { useFeynmanSession } from './state/useFeynmanSession';
import { WorkflowStage } from './types/session';

type WorkflowStepId = 'audience' | 'explain' | 'questions' | 'answers' | 'feedback';

const WORKFLOW_STEPS: Array<{ id: WorkflowStepId; label: string }> = [
    { id: 'audience', label: 'Audience' },
    { id: 'explain', label: 'Explain' },
    { id: 'questions', label: 'Questions' },
    { id: 'answers', label: 'Answers' },
    { id: 'feedback', label: 'Feedback' },
];

const STAGE_TO_STEP: Record<WorkflowStage, WorkflowStepId> = {
    selectAudience: 'audience',
    primePersona: 'audience',
    submitExplanation: 'explain',
    generateQuestions: 'explain',
    reviewQuestions: 'questions',
    answerQuestions: 'answers',
    generateFeedback: 'answers',
    reviewFeedback: 'feedback',
    error: 'explain',
};

const getStageInstruction = (stage: WorkflowStage): string => {
    switch (stage) {
        case 'selectAudience':
            return 'Choose who you are teaching. Start Practice prepares that audience persona.';
        case 'primePersona':
            return 'Preparing the audience persona before you explain.';
        case 'submitExplanation':
            return 'Record your spoken explanation. Generate Questions asks the audience to challenge it.';
        case 'generateQuestions':
            return 'Generating questions that test whether the explanation is clear.';
        case 'reviewQuestions':
            return 'Review the generated questions, then answer or revise your explanation.';
        case 'answerQuestions':
            return 'Record an answer to each question. Get Feedback reviews the learning session.';
        case 'generateFeedback':
            return 'Reviewing your answers and preparing feedback.';
        case 'reviewFeedback':
            return 'Use the feedback to revise, try a different audience, or start a new session.';
        case 'error':
            return 'Recover the current step with Try Again or start over.';
        default:
            return 'Continue the guided practice session.';
    }
};

function App() {
    const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
    const [isSetupOpen, setIsSetupOpen] = useState(false);
    const {
        session,
        selectAudience,
        submitExplanation,
        continueToAnswers,
        reviewQuestions,
        reviseExplanation,
        updateAnswerDraft,
        submitAnswers,
        resetSession,
        changeAudience,
        retry,
    } = useFeynmanSession();

    const currentStep = STAGE_TO_STEP[session.stage];
    const currentStepIndex = WORKFLOW_STEPS.findIndex((step) => step.id === currentStep);
    const hasSessionContent = Boolean(
        session.audience ||
        session.topic ||
        session.explanation ||
        session.questions.length ||
        session.answers.length ||
        session.feedback,
    );
    const answeredCount = session.answers.filter((answer) => answer.answer.trim()).length;

    useEffect(() => {
        let isMounted = true;

        const loadSetupStatus = async () => {
            const status = await setupClient.getStatus();

            if (!isMounted) {
                return;
            }

            setSetupStatus(status);

            if (!isSetupReady(status)) {
                setIsSetupOpen(true);
            }
        };

        void loadSetupStatus();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleSetupComplete = (status: SetupStatus) => {
        setSetupStatus(status);
        setIsSetupOpen(false);
    };

    const handleReset = () => {
        if (
            hasSessionContent &&
            !window.confirm('Start over and clear this practice session?')
        ) {
            return;
        }

        resetSession();
    };

    const handleStepClick = (stepId: WorkflowStepId) => {
        if (stepId === 'audience') {
            changeAudience();
            return;
        }

        if (stepId === 'explain' && session.audience) {
            reviseExplanation();
            return;
        }

        if (stepId === 'questions' && session.questions.length) {
            reviewQuestions();
            return;
        }

        if (stepId === 'answers' && session.questions.length) {
            continueToAnswers();
        }
    };

    const isMacDesktop = Boolean(window.feynman) && navigator.userAgent.includes('Mac');

    const ollamaTone = !setupStatus
        ? 'idle'
        : (isSetupReady(setupStatus) ? 'ok' : (setupStatus.ollama.reachable ? 'warn' : 'err'));
    const ollamaText = !setupStatus
        ? 'Checking Ollama...'
        : (isSetupReady(setupStatus)
            ? `Ollama · ${setupStatus.model.configured}`
            : (setupStatus.ollama.reachable
                ? `Model ${setupStatus.model.configured} missing`
                : 'Ollama offline'));
    const voiceTone = !setupStatus ? 'idle' : (setupStatus.transcription.reachable ? 'ok' : 'warn');
    const voiceText = !setupStatus
        ? 'Checking voice...'
        : (setupStatus.transcription.reachable ? 'Voice ready' : 'Voice offline');

    return (
        <div className="app-shell">
            <header className={`app-titlebar ${isMacDesktop ? 'mac-inset' : ''}`}>
                <div className="titlebar-title">
                    <strong>Feynman Junior</strong>
                    <span>
                        {session.audience
                            ? `Teaching ${session.audience.label.toLowerCase()}${session.topic ? ` about ${session.topic}` : ''}`
                            : 'Guided teaching practice'}
                    </span>
                </div>
                <div className="titlebar-actions">
                    {hasSessionContent && !isSetupOpen && (
                        <button type="button" className="secondary-button subtle" onClick={handleReset}>
                            Start Over
                        </button>
                    )}
                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setIsSetupOpen(true)}
                        disabled={isSetupOpen}
                    >
                        Setup
                    </button>
                </div>
            </header>

            {!isSetupOpen && (
                <nav className="progress-rail" aria-label="Practice progress">
                    {WORKFLOW_STEPS.map((step, index) => {
                        const isCurrent = step.id === currentStep;
                        const isComplete = index < currentStepIndex;
                        const canNavigate = isComplete && step.id !== 'feedback';

                        return (
                            <button
                                type="button"
                                key={step.id}
                                className={`progress-step ${isCurrent ? 'current' : ''} ${isComplete ? 'complete' : ''}`}
                                disabled={!canNavigate || session.isLoading}
                                onClick={() => handleStepClick(step.id)}
                                aria-current={isCurrent ? 'step' : undefined}
                            >
                                <span className="progress-index">{index + 1}</span>
                                <span>{step.label}</span>
                            </button>
                        );
                    })}
                </nav>
            )}

            <div className={`workspace ${isSetupOpen ? 'single' : ''}`}>
                <main className="main-stage">
                    {isSetupOpen && (
                        <SetupStage
                            initialStatus={setupStatus}
                            onComplete={handleSetupComplete}
                        />
                    )}

                    {!isSetupOpen && session.stage === 'selectAudience' && (
                        <AudienceStage onSelectAudience={selectAudience} disabled={session.isLoading} />
                    )}

                    {!isSetupOpen && session.stage === 'primePersona' && (
                        <PrimingStage audience={session.audience} />
                    )}

                    {!isSetupOpen && session.stage === 'submitExplanation' && session.audience && (
                        <ExplanationStage
                            audience={session.audience}
                            onSubmit={submitExplanation}
                            onChangeAudience={changeAudience}
                            initialTopic={session.topic}
                            initialExplanation={session.explanation}
                        />
                    )}

                    {!isSetupOpen && session.stage === 'generateQuestions' && (
                        <PrimingStage audience={session.audience} label="Generating audience questions..." />
                    )}

                    {!isSetupOpen && session.stage === 'reviewQuestions' && (
                        <QuestionStage
                            questions={session.questions}
                            onContinue={continueToAnswers}
                            onRevise={reviseExplanation}
                            onReset={handleReset}
                        />
                    )}

                    {!isSetupOpen && session.stage === 'answerQuestions' && (
                        <AnswerStage
                            questions={session.questions}
                            initialAnswers={session.answers}
                            onDraftChange={updateAnswerDraft}
                            onSubmit={submitAnswers}
                            onBack={reviewQuestions}
                        />
                    )}

                    {!isSetupOpen && session.stage === 'generateFeedback' && (
                        <PrimingStage audience={session.audience} label="Reviewing your answers..." />
                    )}

                    {!isSetupOpen && session.stage === 'reviewFeedback' && (
                        <FeedbackStage
                            session={session}
                            onRevise={reviseExplanation}
                            onReset={handleReset}
                            onChangeAudience={changeAudience}
                        />
                    )}

                    {!isSetupOpen && session.stage === 'error' && (
                        <ErrorState
                            error={session.error}
                            onRetry={retry}
                            onReset={handleReset}
                        />
                    )}
                </main>

                {!isSetupOpen && (
                    <aside className="context-panel" aria-label="Session context">
                        <div>
                            <span className="panel-label">Current step</span>
                            <strong>{WORKFLOW_STEPS[currentStepIndex]?.label || 'Practice'}</strong>
                            <p>{getStageInstruction(session.stage)}</p>
                        </div>
                        <dl className="session-facts">
                            <div>
                                <dt>Audience</dt>
                                <dd>{session.audience?.label || 'Not selected'}</dd>
                            </div>
                            <div>
                                <dt>Topic</dt>
                                <dd>{session.topic || 'Optional'}</dd>
                            </div>
                            <div>
                                <dt>Explanation</dt>
                                <dd>{session.explanation ? 'Draft saved' : 'Not recorded'}</dd>
                            </div>
                            <div>
                                <dt>Questions</dt>
                                <dd>{session.questions.length}</dd>
                            </div>
                            <div>
                                <dt>Answered</dt>
                                <dd>
                                    {answeredCount} of {session.questions.length || 0}
                                </dd>
                            </div>
                        </dl>
                        <div className="helper-card">
                            <span className="panel-label">Practice tip</span>
                            <p>
                                Keep each pass focused: explain once, let the audience ask,
                                answer honestly, then revise the weak point.
                            </p>
                        </div>
                    </aside>
                )}
            </div>

            <footer className="status-bar">
                <div className="status-group">
                    <span className="status-item">
                        <span className={`status-dot ${ollamaTone}`} aria-hidden="true" />
                        {ollamaText}
                    </span>
                    <span className="status-item">
                        <span className={`status-dot ${voiceTone}`} aria-hidden="true" />
                        {voiceText}
                    </span>
                </div>
                <span className="status-step">
                    {isSetupOpen
                        ? 'Setup'
                        : `Step ${currentStepIndex + 1} of ${WORKFLOW_STEPS.length} · ${WORKFLOW_STEPS[currentStepIndex]?.label || 'Practice'}`}
                </span>
            </footer>
        </div>
    );
}

export default App;
