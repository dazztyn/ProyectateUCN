import React from 'react';
import '../style/styleError.css'
interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  if (!message) return null; 
  return (
    <div className="errorContainer">
    <div className="errorTitulo">
      ERROR
    </div>
    <div className="errorMensaje">
      {message}
    </div>
    </div>
  );
};

export default ErrorMessage;