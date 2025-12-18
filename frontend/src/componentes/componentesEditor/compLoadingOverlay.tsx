import React from "react";
import "../../style/styleCarga.css";

const LoadingOverlay: React.FC<{ text?: string }> = ({ text = "Cargando..." }) => {
  return (
    <div className="loading-overlay">
      <div className="loading-card">
        <div className="spinner" />
        <p>{text}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
