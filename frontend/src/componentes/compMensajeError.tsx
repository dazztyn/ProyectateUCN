import React from 'react';
import '../style/styleError.css'
interface ErrorMessageProps {
  message: string;
onClose: () => void; 
}
const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="errorContainer">
      <div className="errorTitulo">ERROR</div>
      <div className="errorMensaje">{message}</div>
      <button className= "errorBoton" onClick={onClose}>Cerrar</button>
    </div>
  );
};

export default ErrorMessage;