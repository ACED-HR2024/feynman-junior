import './App.css';
import AnswerStage from './components/workflow/AnswerStage';
import AudienceStage from './components/workflow/AudienceStage';
import ErrorState from './components/workflow/ErrorState';
import ExplanationStage from './components/workflow/ExplanationStage';
import FeedbackStage from './components/workflow/FeedbackStage';
import PrimingStage from './components/workflow/PrimingStage';
import QuestionStage from './components/workflow/QuestionStage';
import { useFeynmanSession } from './state/useFeynmanSession';

function App() {
    const {
        session,
        selectAudience,
        submitExplanation,
        continueToAnswers,
        reviewQuestions,
        submitAnswers,
        resetSession,
        changeAudience,
        retry,
    } = useFeynmanSession();

    return (
        <div className="app-container">
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
                />
            )}

            {session.stage === 'generateQuestions' && (
                <PrimingStage audience={session.audience} label="Generating audience questions..." />
            )}

            {session.stage === 'reviewQuestions' && (
                <QuestionStage
                    questions={session.questions}
                    onContinue={continueToAnswers}
                    onReset={resetSession}
                />
            )}

            {session.stage === 'answerQuestions' && (
                <AnswerStage
                    questions={session.questions}
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
                    onReset={resetSession}
                    onChangeAudience={changeAudience}
                />
            )}

            {session.stage === 'error' && (
                <ErrorState
                    error={session.error}
                    onRetry={retry}
                    onReset={resetSession}
                />
            )}
        </div>
    );
}

export default App;