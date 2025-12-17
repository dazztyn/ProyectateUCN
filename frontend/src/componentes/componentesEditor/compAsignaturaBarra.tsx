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

// compAsignaturaBarra.tsx

const processResponse = (data: any): AsignaturaDisponible[] => {
    if (Array.isArray(data)) {
        return data.map(a => ({
            codigo: a.codigo,
            nombre: a.asignatura,
            creditos: a.creditos,
            nivel: a.nivel,
            prereq: a.prereq,
            puedeAgregar: true, 
        }));
    }

    const disponibles = (data.disponibles || []).map((a: any) => ({
        codigo: a.codigo,
        nombre: a.asignatura, 
        creditos: a.creditos,
        nivel: a.nivel,
        prereq: a.prereq,
        puedeAgregar: true,
    }));

    const noDisponibles = (data.noDisponibles || []).map((a: any) => ({
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


    if (error) {
        return error;
    }
    


    return (
        <div className="asigcontainer">
            <div className="asig-header">
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
            </div>
            {loading ? (
                <div className="asig-mensaje-estado">Cargando catálogo...</div>
            ) : error ? (
                <div className="asig-mensaje-estado error-texto">
                    {error} 
                    <button onClick={() => setTipoBusqueda('NORMAL')}>Reintentar Normal</button>
                </div>
            ) : asignaturasVisibles.length === 0 ? (
                <div className="asig-mensaje-estado">
                    No hay asignaturas en este modo para el semestre seleccionado.
                </div>
            ) : (
                <div className="asig-lista-scroll">
                    {asignaturasVisibles.map((asig: AsignaturaDisponible) => (
                        <div 
                            key={asig.codigo} 
                            className={`asigcard ${asig.puedeAgregar ? 'puede-agregar' : 'no-disponible'}`}
                        >
                            <div className="asig-info">
                                <h3>{asig.nombre}</h3>
                                <p>{asig.codigo} | Créditos: {asig.creditos}</p>
                            </div>

                            {asig.puedeAgregar ? (
                                <button className="boton-agregar" onClick={() => onAddAsignatura(asig)}>
                                    <img src={addIcon} alt="añadir" className="icon-suma" />
                                </button>
                            ) : (
                                <button className="boton-prereq" onClick={() => togglePrereq(asig.codigo)}>
                                    {openPrereq[asig.codigo] ? 'Ocultar' : 'Ver prereq'}
                                </button>
                            )}
                            {openPrereq[asig.codigo] && !asig.puedeAgregar && (
                                <div className="mensaje-prereq">⚠️ {asig.prereq || 'Sin info'}</div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            {error && <ErrorMessage message={error} onClose={() => setError(null)}/>}
        </div>
    );
};

export default CompAsignaturasDisponibles;