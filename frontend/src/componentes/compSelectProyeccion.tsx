import "../style/styleSeleccionProy.css";
import flecha from "../assets/arrow-down.png"
import React from "react";
import { useState } from "react";

const CompSelectProyeccion: React.FC = () => {
  const [open, setOpen] = useState(false);

  const toggleOpen = () => setOpen(o => !o);

  return (
    <div className="main-container">
      <div className="bloque-existentes" onClick={toggleOpen}>
        Seleccione una proyección guardada
        <img
          src={flecha}
          alt="Flecha"
          className={`iconoArrow ${open ? "open" : ""}`}
        />
      </div>
      <div className="botonGo">
        Ir a Proyección
      </div>
      {open && (
        <ul className="lista-proyecciones">
          <li>Proyección 1</li>
          <li>Proyección 2</li>
          <li>Proyección 3</li>
        </ul>
      )}
    </div>
  );
};
export default CompSelectProyeccion;