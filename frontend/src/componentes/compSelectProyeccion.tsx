import "../style/styleSeleccionProy.css";
import flecha from "../assets/arrow-down.png"
import React from "react";
import { useState } from "react";

const CompSelectProyeccion: React.FC = () => {
  const [open, setOpen] = useState(false);

  const toggleOpen = () => setOpen(o => !o);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

 return (
    <div className="main-container">
      <div className="container-seleccion-general">
        <div className="titulo-seleccion-proy">Proyección Existente</div>
        <div className="bloque-existentes" onClick={toggleOpen}>
          Seleccione una proyección guardada
          <img
            src={flecha}
            alt="Flecha"
            
            className={`iconoArrow ${open ? "open" : ""}`} 
          />
        </div>
        <ul className={`lista-proyecciones ${!open ? "hidden" : ""}`}>
          <li>Proyección 1</li>
          <li>Proyección 2</li>
          <li>Proyección 3</li>
        </ul>
        <div className="botonGo">
          Ir a Proyección Seleccionada
        </div>
        <div className="titulo-seleccion-proy">Proyección Nueva</div>
        <div className="botones-seccion">
        {["Vacía", "Mejor Caso"].map((sec) => (
          <button
            key={sec}
            onClick={() => setSelectedSection(sec)}
            className={`boton-seccion ${
              selectedSection === sec ? "activo" : ""
            }`}
          >
            {sec.charAt(0).toUpperCase() + sec.slice(1)}
          </button>
        ))}
      </div>
      <form>
        Nombre proyeccion nueva
      </form>
      <div className="botonGo">
          Crear Proyección nueva
        </div>
      </div>
    </div>
  );
};
export default CompSelectProyeccion;