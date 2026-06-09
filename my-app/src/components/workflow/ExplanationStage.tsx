import React from 'react';
import TextComposer from '../input/TextComposer';
import { Audience } from '../../types/session';

interface ExplanationStageProps {
    audience: Audience;
    onSubmit: (topic: string, explanation: string) => void;
    onChangeAudience: () => void;
}

const ExplanationStage: React.FC<ExplanationStageProps> = ({
    audience,
    onSubmit,
    onChangeAudience,
}) => (
    <section className="stage-card wide">
        <div className="stage-header">
            <div>
                <h1>Teach {audience.label.toLowerCase()}</h1>
                <p>{audience.description}</p>
            </div>
            <button type="button" className="secondary-button" onClick={onChangeAudience}>
                Change Audience
            </button>
        </div>
        <TextComposer onSubmit={onSubmit} />
    </section>
);

export default ExplanationStage;
