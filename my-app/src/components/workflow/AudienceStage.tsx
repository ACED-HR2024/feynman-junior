import React, { useState } from 'react';
import { AUDIENCES } from '../../services/prompts';
import { AudienceId } from '../../types/session';

interface AudienceStageProps {
    onSelectAudience: (audienceId: AudienceId) => void;
    disabled?: boolean;
}

const AudienceStage: React.FC<AudienceStageProps> = ({ onSelectAudience, disabled = false }) => {
    const [selectedAudienceId, setSelectedAudienceId] = useState<AudienceId | null>(null);

    return (
        <section className="stage-card">
            <div className="stage-intro">
                <span className="eyebrow">Step 1 · Audience</span>
                <h1>Choose who you are teaching.</h1>
                <p>
                    Pick the mental model first. Feynman Junior will use that audience to
                    generate questions that expose unclear parts of your explanation.
                </p>
            </div>

            <div className="audience-grid" role="radiogroup" aria-label="Teaching audience">
                {AUDIENCES.map((audience) => {
                    const isSelected = selectedAudienceId === audience.id;

                    return (
                        <button
                            type="button"
                            className={`audience-card ${isSelected ? 'selected' : ''}`}
                            key={audience.id}
                            disabled={disabled}
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => setSelectedAudienceId(audience.id)}
                        >
                            <span className="audience-card-title">{audience.label}</span>
                            <span className="audience-card-description">{audience.description}</span>
                            <span className="audience-card-example">
                                Example focus: {audience.promptGuidance}
                            </span>
                        </button>
                    );
                })}
            </div>

            <button
                type="button"
                className="primary-button"
                disabled={disabled || !selectedAudienceId}
                onClick={() => {
                    if (selectedAudienceId) {
                        onSelectAudience(selectedAudienceId);
                    }
                }}
            >
                Start Practice
            </button>
        </section>
    );
};

export default AudienceStage;
