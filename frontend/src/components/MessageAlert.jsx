import React, { useEffect } from 'react';
import '../styles/MessageAlert.css'; // CHANGED from './MessageAlert.css'

const MessageAlert = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`message-alert message-${type}`}>
            <span>{message}</span>
            <button className="close-message" onClick={onClose}>&times;</button>
        </div>
    );
};

export default MessageAlert;