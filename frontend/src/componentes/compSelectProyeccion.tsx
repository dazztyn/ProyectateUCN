import "../style/styleSeleccionProy.css";
import flecha from "../assets/arrow-down.png"
import { useState, useEffect } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import ErrorMessage from '../componentes/compMensajeError';

import type { 
  Props,
  ProyeccionGuardada
} from "../types/dataTypesProyeccion";
const CompSelectProyeccion: React.FC<Props> = ({ indice, access_token})  => {
  const [open, setOpen] = useState(false);
  const toggleOpen = () => setOpen(o => !o);

  const [nombreProy, setNombreProy] = useState("");
  const [proyecciones, setProyecciones] = useState<ProyeccionGuardada[]>([]);
  const [loadingProyecciones, setLoadingProyecciones] = useState(true);
  const [selectedProyeccionId, setSelectedProyeccionId] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);
  const handleDeleteProjection = async (e: React.MouseEvent, proyeccionId: number) => {
  e.stopPropagation();

  const proy = proyecciones.find(p => p.id === proyeccionId);
  const confirmar = window.confirm(`¿Estás seguro de que deseas eliminar la proyección "${proy?.nombre}"?`);
  
  if (!confirmar) return;

  setError(null);
  try {
    const resp = await fetch(
      `http://localhost:3000/proyeccion/eliminarProyeccion/${proyeccionId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!resp.ok) throw new Error("No se pudo eliminar la proyección");
    setProyecciones(prev => prev.filter(p => p.id !== proyeccionId));

    if (selectedProyeccionId === proyeccionId) {
      setSelectedProyeccionId(null);
    }

  } catch (e) {
    console.error(e);
    setError("Error al intentar eliminar la proyección.");
  }
};
  const handleCreateProjection = async () => {
    setError('');

    if (!selectedSection) {
      setError("Debes seleccionar 'Personalizable' o 'Mejor Caso'");
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

    const endpoint =
    selectedSection === "Personalizable"
      ? `http://localhost:3000/proyeccion/ProyeccionManual/${indice}`
      : `http://localhost:3000/proyeccion/ProyeccionIdeal/${indice}`;
    try {
      const resp = await fetch(
        endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!resp.ok) throw new Error("Error al crear la proyección, posible nombre duplicado");

      const data = await resp.json();

      navigate(`/editor`, {state: {data}});
      
    } catch (e) {
      setError("No se pudo crear la proyección, posible nombre duplicado");
    }
  };
  const handleGoToExistingProjection = async () => {
  setError(null);

  if (!selectedProyeccionId) {
    setError("Por favor, seleccione una proyección de la lista.");
    return;
  }

  try {
    const resp = await fetch(
      `http://localhost:3000/proyeccion/obtenerProyeccion/${selectedProyeccionId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!resp.ok) {
      throw new Error("Error al obtener la proyección");
    }

    const data = await resp.json();

    navigate("/editor", { state: { data } });

  } catch (e) {
    console.error(e);
    setError("No se pudo cargar la proyección seleccionada.");
  }
};

  useEffect(() => {
    const fetchProyecciones = async () => {
      setLoadingProyecciones(true);
      setError(null);
      try {
        const url = `http://localhost:3000/proyeccion/obtenerProyecciones/${indice}`;
        const resp = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });

        if (!resp.ok) throw new Error("Error al cargar las proyecciones existentes");

        const data: ProyeccionGuardada[] = await resp.json();
        setProyecciones(data);
        
        if (data.length > 0) {
            setSelectedProyeccionId(data[0].id);
        }

      } catch (e) {
        setError(`Error: No se pudieron cargar las proyecciones.`);
        console.error("Error al obtener proyecciones:", e);
      } finally {
        setLoadingProyecciones(false);
      }
    };

    if (indice !== null && access_token) {
        fetchProyecciones();
    }
  }, [indice, access_token]);
  return (
    <div className="main-container">
      <div className="container-seleccion-general">

        {/* EXISTENTES */}
        <div className="titulo-seleccion-proy">Proyección Existente</div>
        <div className="bloque-existentes" onClick={toggleOpen}>
          {loadingProyecciones 
             ? 'Cargando proyecciones...' 
             : selectedProyeccionId 
                ? proyecciones.find(p => p.id === selectedProyeccionId)?.nombre 
                : 'Seleccione una proyección guardada'}
          <img
            src={flecha}
            alt="flecha"
            className={`iconoArrow ${open ? "open" : ""}`}
          />
        </div>
        <ul className={`lista-proyecciones ${!open ? "hidden" : ""}`}>
          {loadingProyecciones && <li>Cargando...</li>}
          {!loadingProyecciones && proyecciones.length === 0 && <li>No hay proyecciones guardadas.</li>}
          
          {proyecciones.map(proy => (
  <li 
    key={proy.id} 
    className={`item-proyeccion-lista ${selectedProyeccionId === proy.id ? 'seleccionada' : ''}`}
    onClick={() => {
      setSelectedProyeccionId(proy.id);
      setOpen(false); 
    }}
  >
    <span className="texto-proy-item">
      {proy.nombre} {proy.esIdeal ? "(Mejor Caso)" : ""}
    </span>

    {/* BOTÓN DE ELIMINAR */}
    <button 
      className="btn-delete-lista" 
      onClick={(e) => handleDeleteProjection(e, proy.id)}
      title="Eliminar proyección"
    >
      🗑️
    </button>
  </li>
))}
        </ul>
        <div 
            className="botonGo-proy" 
            onClick={handleGoToExistingProjection}
            style={{ opacity: selectedProyeccionId && !loadingProyecciones ? 1 : 0.5, cursor: selectedProyeccionId ? 'pointer' : 'not-allowed' }}
        >
          Ir a Proyección Seleccionada
        </div>

        {/* NUEVA */}
        <div className="titulo-seleccion-proy">Proyección Nueva</div>

        <div className="botones-seccion-proy">
          {["Personalizable", "Mejor Caso"].map(sec => (
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