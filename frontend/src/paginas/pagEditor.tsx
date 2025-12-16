import Layout from '../componentes/componentesEditor/layoutWithBanner';
import { useLocation, useNavigate } from 'react-router-dom';
import React from 'react';
import axios from "axios";
import { useState, useEffect } from 'react';
import MallaEditorDisplay from '../componentes/componentesEditor/compMallaEditor';
import CompAsignaturasDisponibles from '../componentes/componentesEditor/compAsignaturaBarra';

import type { 
  FullProyeccionResponse, 
  MallaEditorData,        
  SemestreEditor          
} from '../types/dataTypesEditor';

const calculateSemestreCredits = (malla: MallaEditorData): Record<string, number> => {

  const creditosPorSemestre: Record<string, number> = {};

  malla.forEach((semestre: SemestreEditor) => {
    const totalCreditos = semestre.totalCreditos || 0;
    creditosPorSemestre[String(semestre.numero)] = totalCreditos;
  });

  return creditosPorSemestre;
};
const PagEditor = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const fullResponse = (location.state?.data as FullProyeccionResponse) || {};
  const initialMalla: MallaEditorData = fullResponse.semestres || [];
  const [malla, setMalla] = useState<MallaEditorData>(initialMalla);
  const [seleccionado, setSeleccionado] = React.useState<number | null>(null);
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
 //Nota, corregir cuando haya booleanos de editable/no editable
  useEffect(() => {
    if (seleccionado === null && malla.length > 0) {
      setSeleccionado(malla[0].numero);
    }
  }, [malla, seleccionado]);

  const semestreCredits = React.useMemo(() => {
    return calculateSemestreCredits(malla); 
  }, [malla]);

  const handleSelectSemestre = (semestrePeriodo: number) => {
    if (semestrePeriodo === seleccionado) return;
    setSeleccionado(semestrePeriodo);
    console.log("Semestre seleccionado:", semestrePeriodo);
  }
  if (malla.length === 0) {
    return (
      <Layout>
        <p>Error: No se recibió información de la proyección. Intente de nuevo.</p>
      </Layout>
    );
  }
  
  return (
    <Layout>
        <MallaEditorDisplay 
        malla={malla}
        selectedSemestreId={seleccionado}
        onSelectSemestre={handleSelectSemestre}
        semestreCredits={semestreCredits}
        />
        <CompAsignaturasDisponibles selectedSemestreId={seleccionado} />
    </Layout>
    );
};
export default PagEditor;