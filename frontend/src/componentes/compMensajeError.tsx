import React from 'react';
import '../style/styleError.css';

interface ErrorMessageProps {
  message: string;
  onClose: () => void; 
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="modal-overlay">
      <div className="error-card">
        <div className="error-icon-circle">
          <span>✕</span>
        </div>
        <h2 className="error-card-title">Ha ocurrido un error</h2>
        <p className="error-card-message">{message}</p>
        <div className="error-card-footer">
          <button className="btn-error-close" onClick={onClose}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;