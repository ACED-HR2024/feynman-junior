import React from 'react';
import './AudienceSelect.css';

interface AudienceSelectProps {
    audience: string;
    onAudienceChange: (audience: string) => void;
    disabled?: boolean;
}

const AudienceSelect: React.FC<AudienceSelectProps> = ({audience, onAudienceChange, disabled}) => {
    const handleAudienceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onAudienceChange(e.target.value);
    };

    return (
        <div className="audience-select-container">
            <h1 className="title">Feynman Junior</h1>
            <p className="description">I'm Feynman Junior! A tool tailored to help you solidify your knowledge through the <a href="https://en.wikipedia.org/wiki/Learning_by_teaching">Feynman Technique</a>. Please select the audience that your presentation is catered towards.</p>
            <p className="subtitle">Select your audience:</p>
            <select
                className="audience-dropdown"
                value={audience}
                onChange={handleAudienceChange}
                aria-label="Select audience"
                disabled={disabled}
            >
                <option value="">Select an audience</option>
                <option value="elementary">Elementary school kids</option>
                <option value="middle">Middle school kids</option>
                <option value="high">High school kids</option>
                <option value="undergraduate">Undergraduate students</option>
                <option value="graduate">Graduate students</option>
                <option value="professionals">Professionals</option>
            </select>
        </div>
    );
};

export default AudienceSelect;