import './App.css';
import { useEffect, useState } from 'react';
import AnswerStage from './components/workflow/AnswerStage';
import AudienceStage from './components/workflow/AudienceStage';
import ErrorState from './components/workflow/ErrorState';
import ExplanationStage from './components/workflow/ExplanationStage';
import FeedbackStage from './components/workflow/FeedbackStage';
import PrimingStage from './components/workflow/PrimingStage';
import QuestionStage from './components/workflow/QuestionStage';
import { OllamaConfig } from './config/ollama';
import { desktopConfigClient } from './services/desktopConfigClient';
import { ollamaClient } from './services/ollamaClient';
import { OllamaHealthStatus } from './services/ollamaService';
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
            return 'Preparing the audience persona before you write.';
        case 'submitExplanation':
            return 'Write or dictate your explanation. Generate Questions asks the audience to challenge it.';
        case 'generateQuestions':
            return 'Generating questions that test whether the explanation is clear.';
        case 'reviewQuestions':
            return 'Review the generated questions, then answer or revise your explanation.';
        case 'answerQuestions':
            return 'Answer each question. Get Feedback reviews the learning session.';
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
    const [ollamaConfig, setOllamaConfig] = useState<OllamaConfig | null>(null);
    const [ollamaHealth, setOllamaHealth] = useState<OllamaHealthStatus | null>(null);
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

        const loadDesktopContext = async () => {
            const [config, health] = await Promise.all([
                desktopConfigClient.getOllamaConfig(),
                ollamaClient.checkHealth(),
            ]);

            if (!isMounted) {
                return;
            }

            setOllamaConfig(config);
            setOllamaHealth(health);
        };

        void loadDesktopContext();

        return () => {
            isMounted = false;
        };
    }, []);

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

    const renderBackAction = () => {
        if (session.stage === 'submitExplanation') {
            return (
                <button type="button" className="secondary-button" onClick={changeAudience}>
                    Back to Audience
                </button>
            );
        }

        if (session.stage === 'reviewQuestions') {
            return (
                <button type="button" className="secondary-button" onClick={reviseExplanation}>
                    Back to Explanation
                </button>
            );
        }

        if (session.stage === 'answerQuestions') {
            return (
                <button type="button" className="secondary-button" onClick={reviewQuestions}>
                    Back to Questions
                </button>
            );
        }

        return null;
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <div>
                    <span className="eyebrow">Guided learning session</span>
                    <h1>Feynman Junior</h1>
                    <p>
                        {session.audience
                            ? `Teaching ${session.audience.label.toLowerCase()}${session.topic ? ` about ${session.topic}` : ''}.`
                            : 'Choose an audience, explain a topic, answer questions, and improve.'}
                    </p>
                </div>
                {hasSessionContent && (
                    <button type="button" className="secondary-button" onClick={handleReset}>
                        Start Over
                    </button>
                )}
            </header>

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

            <div className="workspace">
                <main className="main-stage">
                    {session.stage === 'selectAudience' && (
                        <AudienceStage onSelectAudience={selectAudience} disabled={session.isLoading} />
                    )}

                    {session.stage === 'primePersona' && (
                        <PrimingStage audience={session.audience} />
                    )}

                    {session.stage === 'submitExplanation' && session.audience && (
                        <ExplanationStage
                            audience={session.audience}
                            onSubmit={submitExplanation}
                            onChangeAudience={changeAudience}
                            initialTopic={session.topic}
                            initialExplanation={session.explanation}
                        />
                    )}

                    {session.stage === 'generateQuestions' && (
                        <PrimingStage audience={session.audience} label="Generating audience questions..." />
                    )}

                    {session.stage === 'reviewQuestions' && (
                        <QuestionStage
                            questions={session.questions}
                            onContinue={continueToAnswers}
                            onRevise={reviseExplanation}
                            onReset={handleReset}
                        />
                    )}

                    {session.stage === 'answerQuestions' && (
                        <AnswerStage
                            questions={session.questions}
                            initialAnswers={session.answers}
                            onDraftChange={updateAnswerDraft}
                            onSubmit={submitAnswers}
                            onBack={reviewQuestions}
                        />
                    )}

                    {session.stage === 'generateFeedback' && (
                        <PrimingStage audience={session.audience} label="Reviewing your answers..." />
                    )}

                    {session.stage === 'reviewFeedback' && (
                        <FeedbackStage
                            session={session}
                            onRevise={reviseExplanation}
                            onReset={handleReset}
                            onChangeAudience={changeAudience}
                        />
                    )}

                    {session.stage === 'error' && (
                        <ErrorState
                            error={session.error}
                            onRetry={retry}
                            onReset={handleReset}
                        />
                    )}
                </main>

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
                            <dd>{session.explanation ? 'Draft saved' : 'Not written'}</dd>
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
                        <div>
                            <dt>Model</dt>
                            <dd>{ollamaConfig?.model || 'Loading'}</dd>
                        </div>
                        <div>
                            <dt>Ollama</dt>
                            <dd>{ollamaHealth?.message || 'Checking local service'}</dd>
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
            </div>

            <footer className="app-footer">
                <div className="button-row">
                    {renderBackAction()}
                    {hasSessionContent && (
                        <button type="button" className="secondary-button subtle" onClick={handleReset}>
                            Start Over
                        </button>
                    )}
                </div>
                <p>{getStageInstruction(session.stage)}</p>
            </footer>
        </div>
    );
}

export default App;