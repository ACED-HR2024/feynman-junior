import React from 'react';
import { AUDIENCES } from '../../services/prompts';
import { AudienceId } from '../../types/session';

interface AudienceStageProps {
    onSelectAudience: (audienceId: AudienceId) => void;
    disabled?: boolean;
}

const AudienceStage: React.FC<AudienceStageProps> = ({ onSelectAudience, disabled = false }) => (
    <section className="stage-card">
        <h1>Feynman Junior</h1>
        <p>
            Practice the Feynman Technique by teaching a concept to a specific
            audience. Choose who you want to explain your idea to first.
        </p>

        <label className="field-label" htmlFor="audience">
            Select your audience
        </label>
        <select
            id="audience"
            className="text-input"
            defaultValue=""
            disabled={disabled}
            onChange={(event) => {
                if (event.target.value) {
                    onSelectAudience(event.target.value as AudienceId);
                }
            }}
        >
            <option value="">Select an audience</option>
            {AUDIENCES.map((audience) => (
                <option key={audience.id} value={audience.id}>
                    {audience.label}
                </option>
            ))}
        </select>
    </section>
);

export default AudienceStage;
