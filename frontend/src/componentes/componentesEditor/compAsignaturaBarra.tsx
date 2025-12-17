import React from 'react';
import "../../style/styleSelectAsig.css";
import ErrorMessage from '../../componentes/compMensajeError';
import addIcon from '../../assets/addIcon.png';


import { useState, useEffect, useMemo } from 'react';

import type { 
    AsignaturaDisponible, 
    AsignaturasDisponiblesResponse, 
    AsignaturaRawDisponible,
    SemestreEditor
} from '../../types/dataTypesEditor';
type TipoExcepcion = 'NORMAL' | 'SIN_PREREQ' | 'EXTRA_SEMESTRE' | 'COMBINADA';
type Props = {
    selectedSemestreId: number | null; 
    onAddAsignatura: (asignatura: AsignaturaDisponible) => void; 
    access_token: string;
    indiceCarrera: number;
    idProyeccion: number;
    malla: SemestreEditor[];
    tipoBusqueda: TipoExcepcion;
    setTipoBusqueda: (tipo: TipoExcepcion) => void;
};

const processResponse = (data: AsignaturasDisponiblesResponse): AsignaturaDisponible[] => {
    const disponibles = data.disponibles.map(a => ({
        codigo: a.codigo,
        nombre: a.asignatura, 
        creditos: a.creditos,
        nivel: a.nivel,
        prereq: a.prereq,
        puedeAgregar: true,
    }));

    const noDisponibles = data.noDisponibles.map(a => ({
        codigo: a.codigo,
        nombre: a.asignatura,
        creditos: a.creditos,
        nivel: a.nivel,
        prereq: a.prereq,
        puedeAgregar: false,
    }));

    return [...disponibles, ...noDisponibles];
};

const CompAsignaturasDisponibles: React.FC<Props> = ({ 
    selectedSemestreId, 
    onAddAsignatura, 
    access_token, 
    indiceCarrera, 
    idProyeccion,
    malla,
    tipoBusqueda,
    setTipoBusqueda
}) => {
    
    const [allAsignaturas, setAllAsignaturas] = useState<AsignaturaDisponible[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [openPrereq, setOpenPrereq] = useState<Record<string, boolean>>({});;
    const togglePrereq = (codigo: string) => {
            setOpenPrereq(prev => ({
            ...prev,
            [codigo]: !prev[codigo],
            }));
        };
        const asignaturasVisibles = useMemo(() => {
        const codigosEnMalla = new Set(
            malla.flatMap(sem => sem.asignaturas.map(asig => asig.codigo))
        );
        return allAsignaturas.filter((asig: AsignaturaDisponible) => !codigosEnMalla.has(asig.codigo));
    }, [allAsignaturas, malla]);
    useEffect(() => {
    if (indiceCarrera == null || !access_token || !idProyeccion || selectedSemestreId == null) {
        setError("Faltan datos para cargar las asignaturas disponibles.");
        return;
    }

    const fetchAsignaturas = async () => {
        setLoading(true);
        setError(null);

        let url = "";
        if (tipoBusqueda === 'NORMAL') {
            url = `http://localhost:3000/proyeccion/asignaturasDisponibles/${indiceCarrera}?idProyeccion=${idProyeccion}&semestreObjetivo=${selectedSemestreId}`;
        } else {
            url = `http://localhost:3000/proyeccion/asignaturasExcepcion/${indiceCarrera}?idProyeccion=${idProyeccion}&tipo=${tipoBusqueda}&semestreObjetivo=${selectedSemestreId}`;
        }
        try {
            const resp = await fetch(url, {
                headers: { Authorization: `Bearer ${access_token}` },
            });

            if (!resp.ok) {
                throw new Error("Error al cargar la lista de asignaturas.");
            }

            const rawData: AsignaturasDisponiblesResponse = await resp.json();
            setAllAsignaturas(processResponse(rawData));

        } catch (e) {
            console.error(e);
            setError("No se pudo conectar para obtener la lista de asignaturas disponibles.");
        } finally {
            setLoading(false);
        }
    };

    fetchAsignaturas();
}, [indiceCarrera, access_token, idProyeccion, selectedSemestreId, tipoBusqueda]);


    if (loading) {
        return <div className="asigcontainer">Cargando catálogo de asignaturas...</div>;
    }

    if (error) {
        return error;
    }
    
    if (allAsignaturas.length === 0) {
        return <div className="asigcontainer">Advertencia! No hay asignaturas en el catálogo actualmente, pruebe a cambiar de semestre.</div>
    }

    return (
        <div className="asigcontainer">
            <h3>Asignaturas Disponibles</h3>
            <select 
                        id="tipo-busqueda"
                        value={tipoBusqueda} 
                        onChange={(e) => setTipoBusqueda(e.target.value as TipoExcepcion)}
                        className="select-excepcion"
                    >
                        <option value="NORMAL">Estándar</option>
                        <option value="SIN_PREREQ">Levantar Prerrequisitos</option>
                        <option value="EXTRA_SEMESTRE">Adelantar Materias</option>
                        <option value="COMBINADA">Ambas Restricciones</option>
                    </select>
            {asignaturasVisibles.map((asig: AsignaturaDisponible) => ( // <--- Tipo explícito para evitar Error 7006
                <div 
                    key={asig.codigo} 
                    className={`asigcard ${asig.puedeAgregar ? 'puede-agregar' : 'no-disponible'}`}
                >
                    <div className="asig-info">
                        <h3>{asig.nombre}</h3>
                        <p>{asig.codigo} | Créditos: {asig.creditos} | Nivel: {asig.nivel}</p>
                    </div>
                    
                    {!asig.puedeAgregar && (
                        <div className="asig-motivo-bloqueo">
                            <button className="boton-prereq" onClick={() => togglePrereq(asig.codigo)}>
                                {openPrereq[asig.codigo] ? 'Ocultar prereq' : 'Ver prereq'}
                            </button>
                            {openPrereq[asig.codigo] && (
                                <div className="mensaje-prereq">
                                    ⚠️ Prerrequisitos: {asig.prereq || 'N/A'}
                                </div>
                            )}
                        </div>
                    )}

                    {asig.puedeAgregar && (
                        <button 
                            className="boton-agregar"
                            onClick={() => onAddAsignatura(asig)}
                        >
                            <img src={addIcon} alt="añadir" className="icon-suma" />
                        </button>
                    )}
                </div>
            ))}

            {asignaturasVisibles.length === 0 && !loading && (
                <div className="info-asignaturas">No hay más asignaturas disponibles para agregar.</div>
            )}

            {error && <ErrorMessage message={error} onClose={() => setError(null)}/>}
        </div>
    );
};

export default CompAsignaturasDisponibles;