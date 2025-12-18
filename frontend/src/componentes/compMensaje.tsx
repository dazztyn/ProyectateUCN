import React from "react";
import "../style/styleMensaje.css";

type Props = {
  titulo?: string;
  mensaje: string;
  onClose: () => void;
};

const CompMensaje: React.FC<Props> = ({
  titulo = "MENSAJE",
  mensaje,
  onClose,
}) => {
  return (
    <div className="mensaje-overlay">
      <div className="mensaje-container">
        <div className="mensaje-titulo">{titulo}</div>

        <div className="mensaje-texto">
          {mensaje}
        </div>

        <button className="mensaje-boton" onClick={onClose}>
          Aceptar
        </button>
      </div>
    </div>
  );
};

export default CompMensaje;
