import React from 'react';
import "../../style/styleSelectAsig.css";
import ErrorMessage from '../../componentes/compMensajeError';

import { useState, useEffect, useMemo } from 'react';

import type { 
    AsignaturaDisponible, 
    AsignaturasDisponiblesResponse, 
    AsignaturaRawDisponible 
} from '../../types/dataTypesEditor';

type Props = {
    selectedSemestreId: number | null; 
    onAddAsignatura: (asignatura: AsignaturaDisponible) => void; 
    access_token: string;
    indiceCarrera: number;
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

const CompAsignaturasDisponibles: React.FC<Props> = ({ selectedSemestreId, onAddAsignatura, access_token, indiceCarrera }) => {
    
    const [allAsignaturas, setAllAsignaturas] = useState<AsignaturaDisponible[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!indiceCarrera || !access_token) {
            setError("Falta el índice de carrera o el token de acceso.");
            return;
        }

        const fetchAsignaturas = async () => {
            setLoading(true);
            setError(null);
            
            const url = `http://localhost:3000/proyeccion/asignaturasDisponibles/${indiceCarrera}`; 

            try {
                const resp = await fetch(url, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${access_token}` },
                });

                if (!resp.ok) {
                    throw new Error("Error al cargar la lista de asignaturas.");
                }

                const rawData: AsignaturasDisponiblesResponse = await resp.json();

                setAllAsignaturas(processResponse(rawData));

            } catch (e) {
                console.error("Error fetching disponibles:", e);
                setError("No se pudo conectar para obtener la lista de asignaturas disponibles.");
            } finally {
                setLoading(false);
            }
        };

        fetchAsignaturas();
        
    }, [indiceCarrera, access_token]); 


    if (loading) {
        return <div className="loading-asignaturas">Cargando catálogo de asignaturas...</div>;
    }

    if (error) {
        return error;
    }
    
    if (allAsignaturas.length === 0) {
        return <div className="info-asignaturas">No hay asignaturas en el catálogo de esta carrera.</div>
    }

    return (
        <div className="asignaturas-disponibles-container">
            <h3>
                Opciones Disponibles 
                {selectedSemestreId ? ` (Filtrado por Nivel ${selectedSemestreId})` : ` (Catálogo Completo)`}
            </h3>
            {allAsignaturas.map(asig => (
                <div 
                    key={asig.codigo} 
                    className={`asignatura-disponible-card ${asig.puedeAgregar ? 'puede-agregar' : 'no-disponible'}`}
                >
                    <div className="asig-info">
                        <h4>{asig.nombre} ({asig.codigo})</h4>
                        <p>Créditos: {asig.creditos} | Nivel: {asig.nivel}</p>
                    </div>
                    
                    {!asig.puedeAgregar && (
                        <div className="asig-motivo-bloqueo">
                            {/* Aquí puedes usar la propiedad 'prereq' para mostrar el requisito faltante */}
                            ⚠️ Bloqueado. Prerrequisitos: {asig.prereq || 'N/A'}
                        </div>
                    )}
                    
                    {asig.puedeAgregar && (
                         <button 
                             className="boton-agregar"
                             onClick={() => onAddAsignatura(asig)} // Llamamos al prop para agregar
                         >
                             Agregar al Semestre {selectedSemestreId || 'actual'}
                         </button>
                    )}
                </div>
            ))}
            {error && <ErrorMessage message={error} onClose={() => setError(null)}/>}
        </div>
    );
};

export default CompAsignaturasDisponibles;