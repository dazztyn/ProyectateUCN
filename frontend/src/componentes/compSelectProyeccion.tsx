import "../style/styleSeleccionProy.css";
import flecha from "../assets/arrow-down.png"
import { useState } from "react";
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import ErrorMessage from '../componentes/compMensajeError';

type Props = {
  indice: number;
  access_token: string;
};

const CompSelectProyeccion: React.FC<Props> = ({ indice, access_token})  => {
  const [open, setOpen] = useState(false);
  const toggleOpen = () => setOpen(o => !o);

  const [nombreProy, setNombreProy] = useState("");
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);

  const handleCreateProjection = async () => {
    setError('');

    if (!selectedSection) {
      setError("Debes seleccionar 'Vacía' o 'Mejor Caso'");
      return;
    }
    if (nombreProy.trim() === "") {
      setError("Debes ingresar un nombre para la proyección");
      return;
    }

    setError("");

    const body = {
      ideal: selectedSection === "Mejor Caso",
      nombreProyeccion: nombreProy.trim(),
    };
    try {
      const resp = await fetch(
        `http://localhost:3000/proyeccion/${indice}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!resp.ok) throw new Error("Error al crear la proyección");

      const data = await resp.json();

      navigate(`/editor`, {state: {data}});
      
    } catch (e) {
      setError("No se pudo crear la proyección");
    }
  };
  return (
    <div className="main-container">
      <div className="container-seleccion-general">

        {/* EXISTENTES */}
        <div className="titulo-seleccion-proy">Proyección Existente</div>
        <div className="bloque-existentes" onClick={toggleOpen}>
          Seleccione una proyección guardada
          <img
            src={flecha}
            alt="flecha"
            className={`iconoArrow ${open ? "open" : ""}`}
          />
        </div>
        <ul className={`lista-proyecciones ${!open ? "hidden" : ""}`}>
          <li>Proyección 1</li>
          <li>Proyección 2</li>
          <li>Proyección 3</li>
        </ul>
        <div className="botonGo-proy">Ir a Proyección Seleccionada</div>

        {/* NUEVA */}
        <div className="titulo-seleccion-proy">Proyección Nueva</div>

        <div className="botones-seccion-proy">
          {["Vacía", "Mejor Caso"].map(sec => (
            <button
              key={sec}
              onClick={() => setSelectedSection(sec)}
              className={`boton-seccion-proy ${selectedSection === sec ? "activo" : ""}`}
            >
              {sec}
            </button>
          ))}
        </div>

        <form>
          <label htmlFor="nombreProyeccion" className="label-nombre-proy">
            <input
              type="text"
              id="nombreProyeccion"
              name="nombreProyeccion"
              placeholder="Nombre de la Proyección"
              value={nombreProy}
              onChange={(e) => setNombreProy(e.target.value)}
              className="input-nombre-proy"
            />
          </label>
        </form>

        <div className="botonGo-proy" onClick={handleCreateProjection}>
          Crear Proyección nueva
        </div>

      </div>
      {error && <ErrorMessage message={error} onClose={() => setError(null)}/>}
    </div>
  );
};
export default CompSelectProyeccion;