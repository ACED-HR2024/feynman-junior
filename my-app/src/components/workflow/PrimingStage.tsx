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
                ? `Getting ${audience.label.toLowerCase()} ready to ask useful questions.`
                : 'Checking the learning session setup.'}
        </p>
    </section>
);

export default PrimingStage;
