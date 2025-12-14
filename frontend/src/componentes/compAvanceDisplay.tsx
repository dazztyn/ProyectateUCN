import React, { useState, useEffect } from "react";
import ErrorMessage from "./compMensajeError";
import "../style/styleMalla.css";

import type { 
  Avance,
  Props 

} from "../types/dataTypesSimple";

const AvanceDisplay: React.FC<Props> = ({ indice, access_token }) => {
  const [avance, setAvance] = useState<Record<string, Avance[]>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    const obtenerAvance = async () => {
      try {
        setCargando(true);
        setError("");

        const res = await fetch(`http://localhost:3000/avance/${indice}`, {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });

        if (!res.ok) throw new Error("No se pudo obtener el avance del alumno.");

        const data: Record<string, Avance[]> = await res.json();
        setAvance(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    obtenerAvance();
  }, [indice, access_token]);

  if (cargando) return <p className="loading">Cargando avance...</p>;
  if (error) return <ErrorMessage message={error} onClose={() => setError(null)}/>;
  if (!Object.keys(avance).length)
    return <p className="error">No se encontraron registros de avance.</p>;
  const getPeriodoNombre = (periodo: string) => {
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
  return (
    <div className="malla-container">
      {Object.entries(avance).map(([periodo, ramos]) => (
        <div key={periodo} className="semestre-card">
          <div className="semestre-titulo-container">{getPeriodoNombre(periodo)}</div>
          <div className="asignaturas-grid">
            {ramos.map((r) => (
              <div
                key={r.nrc}
                className={`asignatura-card ${
                  r.status === "APROBADO"
                    ? "aprobado"
                    : r.status === "REPROBADO"
                    ? "reprobado"
                    : "cursando"
                }`}
              >
                <h3>{r.course?.codigo || "No Disponible"}</h3>
                <h4>{r.course?.asignatura || "No Disponible"}</h4>
                <h3>Créditos: {r.course?.creditos || "?"}</h3>
                <div className={`status ${
                  r.status === "APROBADO"
                    ? "aprobado"
                    : r.status === "REPROBADO"
                    ? "reprobado"
                    : "cursando"
                }`}>{r.status}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AvanceDisplay;