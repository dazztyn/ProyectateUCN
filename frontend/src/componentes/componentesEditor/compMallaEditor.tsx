import React from "react";
import "../../style/styleMallaEdit.css";

import type { 
  Props ,
  Semestre,
  Asignatura
} from "../../types/dataTypesEditor";

const MallaEditorDisplay: React.FC<Props> = ({ malla, selectedSemestreId, onSelectSemestre, semestreCredits}) => {
  const semestres = Object.entries(malla).map(([periodo, asignaturas]) => ({
    numero: Number(periodo),
    asignaturas,
  }));
  // chequear
  if (!semestres.length) {
    return <p className="error">No hay asignaturas en esta proyección.</p>;
  }
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
    <div className="malla-edit-container">
      {semestres.map((sem) => {

        const isSelected = sem.numero === selectedSemestreId;
        const semestreCardClass = `semestre-edit-card ${isSelected ? 'semestre-edit-card--selected' : ''}`;
        
        return (
          <div 
            key={sem.numero} 
            className={semestreCardClass} 
            onClick={() => onSelectSemestre(sem.numero)} 
          >
            <div className="semestre-titulo-edit-container">
              {getPeriodoNombre(sem.numero.toString())}
              <span>Créditos: {semestreCredits[sem.numero.toString()] || 0}</span>
            </div>

            <div className="asignaturas-grid-edit">
              {sem.asignaturas.map((a) => (
                <div key={a.codigoAsignatura} className="asignatura-card-edit">
                  <h3>Créditos: {a.creditos}</h3>
                  <h4>{a.nombreAsignatura}</h4>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MallaEditorDisplay;
