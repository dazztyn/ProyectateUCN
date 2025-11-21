import React from "react";
import "../../style/styleMalla.css";

type Asignatura = {
  codigoAsignatura: string;
  nombreAsignatura: string;
  creditos: number;
  nivel: number;
  prerrequisitos: string;
};

type Props = {
  malla: Record<string, Asignatura[]>;
};

const MallaEditorDisplay: React.FC<Props> = ({ malla }) => {
  const semestres = Object.entries(malla).map(([periodo, asignaturas]) => ({
    numero: Number(periodo),
    asignaturas,
  }));

  if (!semestres.length) {
    return <p className="error">No hay asignaturas en esta proyección.</p>;
  }

  return (
    <div className="malla-container">
      {semestres.map((sem) => (
        <div key={sem.numero} className="semestre-card">
          <div className="semestre-titulo-container">
            {sem.numero}° Sem.
          </div>

          <div className="asignaturas-grid">
            {sem.asignaturas.map((a) => (
              <div key={a.codigoAsignatura} className="asignatura-card">
                <h3>{a.codigoAsignatura}</h3>
                <h4>{a.nombreAsignatura}</h4>
                <h3>Créditos: {a.creditos}</h3>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MallaEditorDisplay;
