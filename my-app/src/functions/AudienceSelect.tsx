import React from 'react';

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
        <div style={{transition: 'all 0.5s ease-in-out'}}>
            <h1 style={{fontSize: '24px', color: '#3b82f6', marginBottom: '16px'}}>Feynman Junior</h1>
            <p style={{fontSize: '18px', color: '#4b5563', marginBottom: '16px'}}>Select your audience:</p>
            <select
                style={{
                    width: '256px',
                    padding: '8px',
                    fontSize: '18px',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px'
                }}
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

// Default export
export default AudienceSelect;