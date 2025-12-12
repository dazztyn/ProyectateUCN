import React from 'react';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate  } from 'react-router-dom';
import Layout from '../componentes/layoutWithSidebar';
import '../style/stylePagBlanca.css';
import MallaCarrera from '../componentes/compMallaDisplay';
import axios from "axios";

const Malla: React.FC = () => {
const location = useLocation();
  const navigate = useNavigate();

  const [carreraActual, setCarreraActual] = useState<string>("Cargando...");
  const [indice, setIndice] = useState<number | null>(null);
  const [access_token, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);


  const fetchUsuario = async (token: string, i: number) => {
    try {
      const res = await axios.post(
        "http://localhost:3000/alumno",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const carrera = res.data.carreras?.[i]?.nombre;
      setCarreraActual(carrera || "Ninguna seleccionada");
    } catch (err) {
      console.error(err);
      navigate("/seleccion");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const state = location.state as
      | { indice: number; access_token: string }
      | undefined;

    
    if (state?.access_token) {
      setAccessToken(state.access_token);
      setIndice(state.indice);
      fetchUsuario(state.access_token, state.indice);
      return;
    }

    
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/seleccion");
      return;
    }

    const idx = Number(localStorage.getItem("indiceCarrera")) || 0;

    setAccessToken(token);
    setIndice(idx);
    fetchUsuario(token, idx);
  }, [location.state, navigate]);

  if (loading) return <p role="status">Cargando...</p>;
  if (indice === null || !access_token)
    return <p role="alert">No fue posible cargar la información.</p>;
  return (
    <Layout>
      <div role="region" aria-labelledby="titulo-malla">
        <h2 id="titulo-malla">Malla Curricular — {carreraActual}</h2>
        <MallaCarrera indice = {indice} access_token={access_token}/>
      </div>
    </Layout>
  );
};

export default Malla;