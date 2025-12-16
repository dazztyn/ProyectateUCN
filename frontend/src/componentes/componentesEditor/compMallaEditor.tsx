import React from "react";
import "../../style/styleMallaEdit.css";
import lockIcon from '../../assets/lock.png';

import type { 
  Props, 
  AsignaturaEditor, 
  SemestreEditor 
} from "../../types/dataTypesEditor";

const MallaEditorDisplay: React.FC<Props> = ({ malla, selectedSemestreId, onSelectSemestre, semestreCredits, onDeleteAsignatura }) => {
 const semestres = malla as SemestreEditor[];
   
  if (!semestres.length) {
    return <p className="error">No hay semestres definidos en esta proyección.</p>; 
  }
  const getPeriodoNombre = (periodo: string) => {
    const anio = periodo.slice(0, 4);
    const tipo = periodo.slice(4);

    let nombrePeriodo = "";
    switch (tipo) {
      case "10": nombrePeriodo = "1er Sem."; break;
      case "15": nombrePeriodo = "Invierno"; break;
      case "20": nombrePeriodo = "2do Sem."; break;
      default: nombrePeriodo = "Desconocido";
    }

  return `${anio} - ${nombrePeriodo}`;
};
  return (
        <div className="malla-edit-container">
            {semestres.map((sem) => {
                const isSelected = sem.numero === selectedSemestreId;
                
                const isEditable = sem.editable; 
                const semestreCardClass = `semestre-edit-card 
                    ${isSelected ? 'semestre-edit-card--selected' : ''}
                    ${!isEditable ? 'semestre-edit-card--blocked' : ''}`; 
                
                return (
                    <div 
                        key={sem.numero} 
                        className={semestreCardClass} 
                        onClick={isEditable ? () => onSelectSemestre(sem.numero) : undefined} 
                    >
                        <div className="semestre-titulo-edit-container">
                            {getPeriodoNombre(sem.periodo)}
                            <span>Créditos: {semestreCredits[sem.numero.toString()] || 0}</span>
                            
                            {!isEditable && (
                                <img src={lockIcon} alt="Bloqueado" className="icon-lock" title="Semestre no editable"/>
                            )}
                        </div>

                        <div className="asignaturas-grid-edit">
                            {sem.asignaturas.map((a) => (
                                <div 
                                    key={a.codigo} 
                                    className="asignatura-card-edit"
                                >
                                    <h3>Créditos: {a.creditos}</h3>
                                    <h4>{a.nombre}</h4>

                                    {isEditable && (
                                        <button 
                                            className="btn-delete-asig"
                                            title={`Eliminar ${a.nombre}`}
                                            onClick={(e) => {
                                                e.stopPropagation(); 
                                                onDeleteAsignatura(sem.numero, a.codigo);
                                            }}
                                        >
                                            &times;
                                        </button>
                                    )}
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
