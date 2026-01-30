import React from 'react';
import '../styles/LoadingSpinner.css'; // CHANGED from './LoadingSpinner.css'

const LoadingSpinner = () => {
    return (
        <div className="loading-overlay">
            <div className="loading-spinner"></div>
        </div>
    );
};

export default LoadingSpinner;