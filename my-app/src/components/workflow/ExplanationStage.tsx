import React from 'react';
import VoiceComposer from '../input/VoiceComposer';
import { Audience } from '../../types/session';

interface ExplanationStageProps {
    audience: Audience;
    onSubmit: (topic: string, explanation: string) => void;
    onChangeAudience: () => void;
    initialTopic?: string;
    initialExplanation?: string;
}

const ExplanationStage: React.FC<ExplanationStageProps> = ({
    audience,
    onSubmit,
    onChangeAudience,
    initialTopic = '',
    initialExplanation = '',
}) => (
    <section className="stage-card wide">
        <div className="stage-header">
            <div>
                <span className="eyebrow">Step 2 · Explain</span>
                <h1>Teach {audience.label.toLowerCase()} — out loud.</h1>
                <p>
                    {audience.description} Record yourself explaining the idea, tidy
                    the transcript, then let the audience challenge it.
                </p>
            </div>
            <button type="button" className="secondary-button" onClick={onChangeAudience}>
                Change Audience
            </button>
        </div>
        <VoiceComposer
            onSubmit={onSubmit}
            initialTopic={initialTopic}
            initialExplanation={initialExplanation}
        />
    </section>
);

export default ExplanationStage;
