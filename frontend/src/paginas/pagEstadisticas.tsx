import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../componentes/layoutWithSidebar';
import '../style/stylePagBlanca.css';
import '../style/styleLogin.css';

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

    // ESTADOS
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
            // ✅ Agregamos el parámetro 'top' con el valor del límite
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
            <div className="contenedor-estadisticas" style={{ padding: '2rem', width: '100%' }}>
                
                <h1 className="titulo-seccion">Panel de Estadísticas</h1>
                <p className="descripcion-seccion">Analítica de gestión de asignaturas.</p>

                {/* --- ZONA DE FILTROS --- */}
                <div className="card-filtros" style={{ 
                    backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '2rem',
                    display: 'flex', gap: '2rem', alignItems: 'end', flexWrap: 'wrap'
                }}>
                    
                    {/* Selector de Modo */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontWeight: 'bold', color: '#555' }}>Tipo de Reporte:</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                                onClick={() => setModo('demanda')}
                                className={`boton-modo ${modo === 'demanda' ? 'activo' : ''}`}
                                style={{ 
                                    padding: '0.5rem 1rem', 
                                    backgroundColor: modo === 'demanda' ? '#065d6d' : '#e5e7eb',
                                    color: modo === 'demanda' ? 'white' : '#333',
                                    border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
                                }}
                            >
                                📊 Demanda
                            </button>
                            <button 
                                onClick={() => setModo('reprobacion')}
                                className={`boton-modo ${modo === 'reprobacion' ? 'activo' : ''}`}
                                style={{ 
                                    padding: '0.5rem 1rem', 
                                    backgroundColor: modo === 'reprobacion' ? '#dc2626' : '#e5e7eb',
                                    color: modo === 'reprobacion' ? 'white' : '#333',
                                    border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
                                }}
                            >
                                📉 Reprobación
                            </button>
                        </div>
                    </div>

                    {/* NUEVO: Input para Código de Carrera */}
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label>Cód. Carrera (Ej: 8266):</label>
                        <input 
                            type="text" 
                            value={codigoCarrera} 
                            onChange={(e) => setCodigoCarrera(e.target.value)}
                            placeholder="8266"
                            style={{ padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px', width: '80px' }}
                        />
                    </div>

                    {/* Input de Periodo */}
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label>Periodo (Ej: 202510):</label>
                        <input 
                            type="text" 
                            value={periodo} 
                            onChange={(e) => setPeriodo(e.target.value)}
                            placeholder="202510"
                            style={{ padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px', width: '100px' }}
                        />
                    </div>

                    {/* ✅ NUEVO: Input para límite de resultados */}
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label>Límite (Top):</label>
                        <input 
                            type="number" 
                            value={limite} 
                            onChange={(e) => setLimite(Math.max(1, parseInt(e.target.value) || 20))}
                            min="1"
                            max="100"
                            placeholder="20"
                            style={{ padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px', width: '70px' }}
                        />
                    </div>

                    <button 
                        className="boton-ingresar" 
                        onClick={cargarEstadisticas} 
                        disabled={loading || !codigoCarrera}
                        style={{ 
                            height: '42px', 
                            minWidth: '120px',
                            color: 'white',
                            backgroundColor: loading || !codigoCarrera ? '#9ca3af' : '#065d6d',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading || !codigoCarrera ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        {loading ? 'Cargando...' : 'Consultar'}
                    </button>
                </div>

                {/* MENSAJES DE ERROR */}
                {error && (
                    <div style={{ 
                        padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', 
                        borderRadius: '4px', marginBottom: '1rem', border: '1px solid #fca5a5' 
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* TABLA DE RESULTADOS (Igual que antes) */}
                <div className="tabla-container" style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: modo === 'demanda' ? '#065d6d' : '#991b1b', color: 'white', textAlign: 'left' }}>
                                <th style={{ padding: '1rem' }}>#</th>
                                <th style={{ padding: '1rem' }}>Código</th>
                                <th style={{ padding: '1rem' }}>Asignatura</th>
                                {modo === 'demanda' ? (
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Demanda (Ideal)</th>
                                ) : (
                                    <>
                                        <th style={{ padding: '1rem', textAlign: 'center' }}>Total</th>
                                        <th style={{ padding: '1rem', textAlign: 'center' }}>Reprobados</th>
                                        <th style={{ padding: '1rem', textAlign: 'center' }}>Tasa Fallo</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {datos.length > 0 ? datos.map((d, index) => (
                                <tr key={d.codigo} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                                    <td style={{ padding: '1rem', fontWeight: 'bold', color: '#555' }}>#{index + 1}</td>
                                    <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{d.codigo}</td>
                                    <td style={{ padding: '1rem' }}>{d.nombre}</td>
                                    
                                    {modo === 'demanda' ? (
                                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', color: '#065d6d' }}>
                                            {/* INTENTA TODAS LAS OPCIONES POSIBLES PARA DEMANDA */}
                                            {d.total_inscritos || d.total || 0}
                                        </td>
                                    ) : (
                                        <>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                {/* INTENTA TODAS LAS OPCIONES PARA TOTAL INTENTOS */}
                                                {d.total_intentos || d.total || 0}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center', color: '#dc2626', fontWeight: 'bold' }}>
                                                {/* INTENTA TODAS LAS OPCIONES PARA REPROBADOS */}
                                                {d.total_reprobados || d.reprobados || 0}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>
                                                {/* CÁLCULO SEGURO: Convierte a número lo que encuentre */}
                                                {(() => {
                                                    const total = Number(d.total_intentos || d.total || 0);
                                                    const repro = Number(d.total_reprobados || d.reprobados || 0);
                                                    if (total === 0) return '0.0%';
                                                    return ((repro / total) * 100).toFixed(1) + '%';
                                                })()}
                                            </td>
                                        </>
                                    )}
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={modo === 'demanda' ? 4 : 6} style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
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