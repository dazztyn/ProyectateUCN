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
    <div className="errorContainer warning-mode"> 
      <div className="errorTitulo">ADVERTENCIA</div>
      <div className="errorMensaje">{message}</div>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button className="errorBoton" onClick={onClose}>Volver</button>
        {showConfirm && (
          <button className="errorBoton" style={{ backgroundColor: '#27ae60' }} onClick={onConfirm}>
            Levantar Restricción
          </button>
        )}
      </div>
    </div>
  );
};

export default CompAdvertenciaCreditos;