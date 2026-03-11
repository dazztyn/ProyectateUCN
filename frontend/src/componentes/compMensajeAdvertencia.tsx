import React from 'react';
import '../style/styleError.css'; 

interface WarningProps {
  message: string;
  onClose: () => void;
  onConfirm: () => void;
  showConfirm: boolean;
}

const CompAdvertenciaCreditos: React.FC<WarningProps> = ({ message, onClose, onConfirm, showConfirm }) => {
  return (
    <div className="modal-overlay"> 
      <div className="warning-card">
        <div className="warning-icon"></div>
        <h2 className="warning-title">Restricción de Créditos</h2>
        <p className="warning-message">{message}</p>
        
        <div className="warning-actions">
          <button className="btn-secondary" onClick={onClose}>
            Volver
          </button>
          
          {showConfirm && (
            <button className="btn-warning-confirm" onClick={onConfirm}>
              Levantar Restricción
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompAdvertenciaCreditos;