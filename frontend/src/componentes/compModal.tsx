import React from 'react';
import '../style/styleModal.css';

interface ModalProps {
  isOpen: boolean;
  titulo?: string;
  mensaje: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ModalConfirm: React.FC<ModalProps> = ({ isOpen, titulo, mensaje, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{titulo || "¡Atención!"}</h3>
        </div>
        <div className="modal-body">
          <p>{mensaje}</p>
        </div>
        <div className="modal-footer">
          <button className="btn-modal-cancel" onClick={onCancel}>Cancelar</button>
          <button className="btn-modal-confirm" onClick={onConfirm}>Proseguir</button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirm;