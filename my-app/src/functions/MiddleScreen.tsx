import React from 'react';

interface MiddleScreenProps {
    audience: string;
}

const MiddleScreen: React.FC<MiddleScreenProps> = ({ audience }) => {
    return (
        <div className="middle-screen">
            <h2>The code monkeys are logging in.</h2>
            <p>Please wait while we get everything ready...</p>
            <div className="loading-spinner"></div>
        </div>
    );
};

export default MiddleScreen;