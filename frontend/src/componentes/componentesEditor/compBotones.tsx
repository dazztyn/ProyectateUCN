
import React from 'react';
import addIcon from '../../assets/addIcon.png'; 
import saveIcon from '../../assets/floppy-disc.png'; 
import bulbIcon from '../../assets/lightbulb.png';
import deleteIcon from '../../assets/trash-can.png';
import '../../style/styleSeccionButtons.css';

type Props = {
    onSaveProyeccion: () => void;
    onAddSemestre: () => void;
    onAutocompletar: () => void;
    onEliminarSemestre: () => void;
    isDirty: boolean;
};

const CompBarraControlesProyeccion: React.FC<Props> = ({ onSaveProyeccion, onAddSemestre, onAutocompletar, onEliminarSemestre, isDirty }) => {
    return (
        <div className="seccion-botones">
            <button 
                className={`boton-guardar ${!isDirty ? '' : 'dirty'}`}
                onClick={onSaveProyeccion} 
            >
                Guardar Proyección
                <img src={saveIcon} alt="icono guardar" className="icon-mini"/>
            </button>
            
            <button 
                className="boton-top"
                onClick={onAddSemestre} 
            >
                Añadir Semestre 
                <img src={addIcon} alt="icono añadir semestre a proyeccion" className="icon-mini"/>
            </button>
            <button 
                className="boton-top"
                onClick={onAutocompletar} 
            >
                Autocompletar
                <img src={bulbIcon} alt="icono autocompletar" className="icon-mini"/>
            </button>
            <button 
                className="boton-top"
                onClick={onEliminarSemestre} 
            >
                Eliminar Semestre
                <img src={deleteIcon} alt="icono eliminar semestre" className="icon-mini"/>
            </button>
        </div>
    );
};

export default CompBarraControlesProyeccion;