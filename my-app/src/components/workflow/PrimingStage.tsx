import React from 'react';
import { Audience } from '../../types/session';

interface PrimingStageProps {
    audience: Audience | null;
    label?: string;
}

const PrimingStage: React.FC<PrimingStageProps> = ({ audience, label = 'Preparing your audience...' }) => (
    <section className="stage-card center">
        <div className="loading-spinner" aria-hidden="true" />
        <h2>{label}</h2>
        <p>
            {audience
                ? `Getting ${audience.label.toLowerCase()} ready so the next step has audience-specific questions.`
                : 'Checking the local learning session setup.'}
        </p>
        <p className="helper-note">
            This usually takes a moment while the local model prepares the response.
        </p>
    </section>
);

export default PrimingStage;
