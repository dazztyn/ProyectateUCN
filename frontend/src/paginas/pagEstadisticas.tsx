import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../componentes/layoutWithTopbar';
import '../style/stylePagBlanca.css';
import '../style/styleAdmin.css';

interface DatoEstadistica {
    codigo: string;
    nombre: string;
    total?: string | number;
    total_inscritos?: string | number;
    total_intentos?: string | number;
    total_reprobados?: string | number;
    reprobados?: string | number;
    [key: string]: any;
}

const Estadisticas: React.FC = () => {
    const navigate = useNavigate();
    const access_token = localStorage.getItem("access_token");

    const [periodo, setPeriodo] = useState('202510');
    const [codigoCarrera, setCodigoCarrera] = useState('8266'); 
    const [limite, setLimite] = useState(20); // ✅ Nuevo estado para límite
    const [modo, setModo] = useState<'demanda' | 'reprobacion'>('demanda');
    const [datos, setDatos] = useState<DatoEstadistica[]>([]);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!access_token) {
            navigate('/');
        }
    }, [access_token, navigate]);

    const cargarEstadisticas = async () => {
        if (!codigoCarrera) {
            setError("Debes ingresar un código de carrera (ej: 8266)");
            return;
        }

        setLoading(true);
        setError('');
        setDatos([]);

        try {
            const endpoint = modo === 'demanda' ? 'demanda' : 'reprobacion';
            const url = `http://localhost:3000/estadisticas/${endpoint}/${codigoCarrera}?periodo=${periodo}&top=${limite}`;

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${access_token}` },
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Error al cargar datos');
            }
            
            const data = await res.json();
            setDatos(data);
            if (data.length === 0) setError('No se encontraron datos para este periodo.');
            
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
    <Layout>
        <div className="contenedor-estadisticas">
            <h1 className="titulo-seccion">Panel de Estadísticas</h1>
            <h2 className="descripcion-seccion">Analítica de gestión de asignaturas.</h2>

            <div className="card-filtros">
                
                <div className="filtro-grupo">
                    <label>Tipo de Reporte:</label>
                    <div className="grupo-botones-modo">
                        <button 
                            onClick={() => setModo('demanda')}
                            className={`boton-modo ${modo === 'demanda' ? 'activo-demanda' : ''}`}
                        >
                            📊 Demanda
                        </button>
                        <button 
                            onClick={() => setModo('reprobacion')}
                            className={`boton-modo ${modo === 'reprobacion' ? 'activo-reprobacion' : ''}`}
                        >
                            📉 Reprobación
                        </button>
                    </div>
                </div>

                <div className="filtro-grupo">
                    <label>Cód. Carrera:</label>
                    <input 
                        type="text" 
                        className="input-admin"
                        style={{ width: '80px' }} 
                        value={codigoCarrera} 
                        onChange={(e) => setCodigoCarrera(e.target.value)}
                        placeholder="8266"
                    />
                </div>

                <div className="filtro-grupo">
                    <label>Periodo:</label>
                    <input 
                        type="text" 
                        className="input-admin"
                        style={{ width: '100px' }}
                        value={periodo} 
                        onChange={(e) => setPeriodo(e.target.value)}
                    />
                </div>

                <div className="filtro-grupo">
                    <label>Límite (Top):</label>
                    <input 
                        type="number" 
                        className="input-admin"
                        style={{ width: '70px' }}
                        value={limite} 
                        onChange={(e) => setLimite(Math.max(1, parseInt(e.target.value) || 20))}
                    />
                </div>

                <button 
                    className="boton-consultar" 
                    onClick={cargarEstadisticas} 
                    disabled={loading || !codigoCarrera}
                >
                    {loading ? 'Cargando...' : 'Consultar'}
                </button>
            </div>

            {/* MENSAJES DE ERROR */}
            {error && (
                <div className="mensaje-error-admin">
                    <span>⚠️</span> {error}
                </div>
            )}

            {/* TABLA DE RESULTADOS */}
            <div className="tabla-container">
                <table className="tabla-admin">
                    <thead>
                        <tr className={modo === 'demanda' ? 'thead-demanda' : 'thead-reprobacion'}>
                            <th>#</th>
                            <th>Código</th>
                            <th>Asignatura</th>
                            {modo === 'demanda' ? (
                                <th style={{ textAlign: 'center' }}>Demanda (Ideal)</th>
                            ) : (
                                <>
                                    <th style={{ textAlign: 'center' }}>Total</th>
                                    <th style={{ textAlign: 'center' }}>Reprobados</th>
                                    <th style={{ textAlign: 'center' }}>Tasa Fallo</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {datos.length > 0 ? datos.map((d, index) => (
                            <tr key={d.codigo} className="fila-cebra">
                                <td style={{ fontWeight: 'bold', color: '#64748b' }}>#{index + 1}</td>
                                <td style={{ fontFamily: 'monospace' }}>{d.codigo}</td>
                                <td>{d.nombre}</td>
                                {modo === 'demanda' ? (
                                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#065d6d' }}>
                                        {d.total_inscritos || d.total || 0}
                                    </td>
                                ) : (
                                    <>
                                        <td style={{ textAlign: 'center' }}>{d.total_intentos || d.total || 0}</td>
                                        <td style={{ textAlign: 'center', color: '#dc2626', fontWeight: 'bold' }}>
                                            {d.total_reprobados || d.reprobados || 0}
                                        </td>
                                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                            {(() => {
                                                const t = Number(d.total_intentos || d.total || 0);
                                                const r = Number(d.total_reprobados || d.reprobados || 0);
                                                return t === 0 ? '0.0%' : ((r / t) * 100).toFixed(1) + '%';
                                            })()}
                                        </td>
                                    </>
                                )}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={modo === 'demanda' ? 4 : 6} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                    {loading ? 'Procesando datos...' : 'Ingresa los parámetros y presiona Consultar.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </Layout>
);
};

export default Estadisticas;