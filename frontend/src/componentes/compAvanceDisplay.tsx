import React, { useState, useEffect } from "react";
import ErrorMessage from "./compMensajeError";
import { useMemo } from "react";
import "../style/styleMalla.css";

import type { 
  Avance,
  Props,
  AvanceData

} from "../types/dataTypesSimple";
interface AsignaturaCardProps {
  ramo: Avance;
}
const AsignaturaCard: React.FC<AsignaturaCardProps> = React.memo(({ ramo }) => {

  const getEstadoClase = (estado: string) => {
    switch (estado) {
      case "APROBADO":
        return "aprobado";
      case "REPROBADO":
        return "reprobado";
      case "INSCRITO":
        return "cursando"; 
      default:
        return "cursando";
    }
  };

  const estadoClase = getEstadoClase(ramo.estado);

  return (
    <div
      key={ramo.nrc}
      className={`asignatura-card ${estadoClase}`}
    >
      <h3>{ramo.codigo || "No Disponible"}</h3>
      <h4>{ramo.asignatura || "No Disponible"}</h4>
      <h3>Créditos: {ramo.creditos || "?"}</h3>
      <div className={`status ${estadoClase}`}>{ramo.estado}</div>
    </div>
  );
});

const getPeriodoNombre = (periodo: string): string => {
  const anio = periodo.slice(0, 4);
  const tipo = periodo.slice(4);

  let nombrePeriodo = "";
  switch (tipo) {
    case "10":
      nombrePeriodo = "1er Sem.";
      break;
    case "15":
      nombrePeriodo = "Invierno";
      break;
    case "20":
      nombrePeriodo = "2do Sem.";
      break;
    default:
      nombrePeriodo = "Desconocido";
  }

  return `${anio} - ${nombrePeriodo}`;
};
const AvanceDisplay: React.FC<Props> = ({ indice, access_token }) => {
  const [avance, setAvance] = useState<AvanceData>({}); 
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const obtenerAvance = async () => {
      try {
        setCargando(true);
        setError(null); 

        const res = await fetch(`http://localhost:3000/avance/${indice}`, {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`No se pudo obtener el avance del alumno. Código: ${res.status}`);
        }

        const data: AvanceData = await res.json();
        setAvance(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido al obtener avance.");
      } finally {
        setCargando(false);
      }
    };

    obtenerAvance();
  }, [indice, access_token]);

  // Utilizamos useMemo para obtener las entradas del objeto, solo recalculando si 'avance' cambia.
  const avanceEntries = useMemo(() => Object.entries(avance).sort((a, b) => a[0].localeCompare(b[0])), [avance]);

  if (cargando) return <p className="loading">Cargando avance...</p>;
  if (error) return <ErrorMessage message={error} onClose={() => setError(null)}/>;
  if (!avanceEntries.length)
    return <p className="error">No se encontraron registros de avance.</p>;
  
  return (
    <div className="malla-container">
      {avanceEntries.map(([periodo, ramos]) => (
        <div key={periodo} className="semestre-card">
          <div className="semestre-titulo-container">{getPeriodoNombre(periodo)}</div>
          <div className="asignaturas-grid">
            {ramos.map((ramo) => (
              <AsignaturaCard key={ramo.nrc} ramo={ramo} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AvanceDisplay;