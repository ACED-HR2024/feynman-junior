import React from 'react';

const audiences = [
    { label: 'Elementary School Kids', value: 'elementary' },
    { label: 'Middle School Kids', value: 'middle' },
    { label: 'High School Kids', value: 'high' },
    { label: 'Undergraduate Students', value: 'undergraduate' },
    { label: 'Graduate Students', value: 'graduate' },
    { label: 'Professionals', value: 'professional' },
];

const AudienceSelect = ({ onAudienceChange }) => {
    const handleChange = (event) => {
        onAudienceChange(event.target.value);
    };

    return (
        <select onChange={handleChange}>
            <option value="">Select an audience</option>
            {audiences.map((audience) => (
                <option key={audience.value} value={audience.value}>
                    {audience.label}
                </option>
            ))}
        </select>
    );
};

export default AudienceSelect;