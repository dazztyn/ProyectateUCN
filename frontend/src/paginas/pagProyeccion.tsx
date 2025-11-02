import React from 'react';
import Layout from '../componentes/layoutWithSidebar';
import SelectProy from '../componentes/compSelectProyeccion';
import { useNavigate, useLocation  } from 'react-router-dom';
import { useState, useEffect } from 'react';
const Proyeccion: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [carreraActual, setCarreraActual] = useState<string>('Cargando...');
  const [indice, setIndice] = useState<number | null>(null);
  const [access_token, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const state = location.state as { indice: number; access_token: string } | undefined;

    if (state && state.access_token !== undefined) {
      setAccessToken(state.access_token);
      setIndice(state.indice);

      const fetchUsuario = async () => {
        try {
          const res = await fetch('http://localhost:3000/alumno', {
            method: 'POST',
            headers: { 
              Authorization: `Bearer ${state.access_token}` },
          });
          if (!res.ok) throw new Error('Error al obtener usuario');
          const data = await res.json();
          setCarreraActual(data.carreras[state.indice]?.nombre || 'Ninguna seleccionada');
        } catch (err) {
          console.error(err);
        }
      };
      fetchUsuario();
    } else {

      const token = sessionStorage.getItem('access_token');
      if (!token) {
        navigate('/seleccion'); 
        return;
      }
      setAccessToken(token);

      const fetchUsuario = async () => {
        try {
          const res = await fetch('http://localhost:3000/alumno', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error('Error al obtener usuario');
          const data = await res.json();
          const savedIndex = sessionStorage.getItem('indiceCarrera');
          const idx = savedIndex ? Number(savedIndex) : 0;
          setIndice(idx);
          setCarreraActual(data.carreras[idx]?.nombre || 'Ninguna seleccionada');
        } catch (err) {
          console.error(err);
        }
      };
      fetchUsuario();
    }
  }, [location.state, navigate]);
  if (indice === null || !access_token) return <p>Cargando...</p>;
  return (
    <Layout>
    <div>
      <h2>Proyeccion Curricular - {carreraActual}</h2>
      <SelectProy />
      <button onClick={() => navigate('/editor')}>Ir al Editor de Proyecciones</button>
    </div>
    </Layout>
  );
}

export default Proyeccion;