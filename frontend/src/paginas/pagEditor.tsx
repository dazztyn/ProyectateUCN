import Layout from '../componentes/componentesEditor/layoutWithBanner';
import { useLocation, useNavigate } from 'react-router-dom';
import React from 'react';
import axios from "axios";
import '../style/styleEdit.css';
import { useState, useEffect } from 'react';
import MallaEditorDisplay from '../componentes/componentesEditor/compMallaEditor';
import CompAsignaturasDisponibles from '../componentes/componentesEditor/compAsignaturaBarra';
import CompBarraControlesProyeccion from '../componentes/componentesEditor/compBotones';

import type { 
  FullProyeccionResponse, 
  MallaEditorData,        
  SemestreEditor,
  AsignaturaDisponible          
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
  const [proyeccionId, setProyeccionId] = useState<number | null>(fullResponse.id || null);
  const [proyeccionNombre, setProyeccionNombre] = useState<string>(fullResponse.nombre || "Sin Nombre");
  const [malla, setMalla] = useState<MallaEditorData>(initialMalla);
  const [seleccionado, setSeleccionado] = React.useState<number | null>(null);
  const [indice, setIndice] = useState<number | null>(null);
  const [access_token, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

 //Nota, corregir cuando haya booleanos de editable/no editable
  useEffect(() => {
    if (seleccionado === null && malla.length > 0) {
      setSeleccionado(malla[0].numero);
    }
  }, [malla, seleccionado]);
  useEffect(() => {
    if (fullResponse.id) {
        setProyeccionId(fullResponse.id);
        setProyeccionNombre(fullResponse.nombre);
    }
  }, [fullResponse]);
  const fetchUsuario = async (token: string, i: number) => {
    try {
      const res = await axios.post(
        "http://localhost:3000/alumno",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

    } catch (err) {
      console.error(err);
      navigate("/seleccion");
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteAsignatura = (semestreNumero: number, codigoAsignatura: string) => {
    setMalla(prevMalla => {
        const updatedMalla = prevMalla.map(sem => {
            if (sem.numero === semestreNumero) {
                const updatedAsignaturas = sem.asignaturas.filter(a => a.codigo !== codigoAsignatura);
                const totalCreditos = updatedAsignaturas.reduce((sum, a) => sum + a.creditos, 0);
                return {
                    ...sem,
                    asignaturas: updatedAsignaturas,
                    totalCreditos: totalCreditos
                };
            }
            return sem;
        });
        return updatedMalla;
    });
  };
  const handleAddSemestre = () => {
    // Buscamos el número de semestre más alto en la malla actual.
    const maxSemestre = malla.reduce((max, semestre) => 
        Math.max(max, semestre.numero), 0);
        
    const newNumero = maxSemestre + 1;
    
    const newSemestre: SemestreEditor = {
        numero: newNumero, 
        periodo: `S${newNumero}`, 
        totalCreditos: 0, 
        asignaturas: [],
        editable: true, 
    };
    setMalla(prevMalla => [...prevMalla, newSemestre]);
    setSeleccionado(newNumero); 
    console.log(`Semestre ${newNumero} creado exitosamente.`);
};
  const semestreCredits = React.useMemo(() => {
    return calculateSemestreCredits(malla); 
  }, [malla]);

  const handleSelectSemestre = (semestrePeriodo: number) => {
    if (semestrePeriodo === seleccionado) return;
    setSeleccionado(semestrePeriodo);
    console.log("Semestre seleccionado:", semestrePeriodo);
  }
  const handleAddAsignatura = (asignatura: AsignaturaDisponible) => {
    if (seleccionado === null) {
        alert("Primero selecciona un semestre para agregar la asignatura.");
        return;
    }
    
    setMalla(prevMalla => {
        const updatedMalla = prevMalla.map(sem => {
            if (sem.numero === seleccionado) {

                const nuevaAsignatura = {
                    codigo: asignatura.codigo,
                    nombre: asignatura.nombre,
                    creditos: asignatura.creditos,
                    estado: 'PENDIENTE' as const, // Asumimos 'PENDIENTE' al agregarla
                };
          
                if (sem.asignaturas.some(a => a.codigo === nuevaAsignatura.codigo)) {
                    console.warn(`La asignatura ${asignatura.nombre} ya está en el semestre.`);
                    return sem;
                }
                return {
                    ...sem,
                    asignaturas: [...sem.asignaturas, nuevaAsignatura],
                    totalCreditos: sem.totalCreditos + nuevaAsignatura.creditos,
                };
            }
            return sem;
        });
        
        return updatedMalla;
    });
};
  const handleSaveProyeccion = () => {
      console.log("Guardando proyección...", malla);
  };
  const handleAutocompletar = async () => {
    if (!access_token || indice === null || !proyeccionId) {
        alert("Faltan datos para realizar la operación.");
        return;
    }

    const confirmar = window.confirm(
        "¿Estás seguro? Se autocompletará tu proyección con el camino ideal y se perderán los cambios no guardados en los semestres editables."
    );
    if (!confirmar) return;

    setLoading(true);

    try {
        const url = `http://localhost:3000/proyeccion/autocompletar/${indice}?idProyeccion=${proyeccionId}`;
        
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error("Error al intentar autocompletar la proyección.");
        }

        const data: FullProyeccionResponse = await response.json();

        setMalla(data.semestres);
        if (data.semestres.length > 0) {
            setSeleccionado(data.semestres[0].numero);
        }

        alert("Proyección autocompletada con éxito.");

    } catch (err) {
        console.error("Error en Autocompletar:", err);
        alert("Hubo un fallo al obtener la proyección ideal.");
    } finally {
        setLoading(false);
    }
};

  
  if (loading) return <p role="status">Cargando...</p>;
  if (indice === null || !access_token)
    return <p role="alert">No fue posible cargar la información.</p>;
  if (malla.length === 0) {
    return (
      <Layout nombreProyeccion = "error">
        <p>Error: No se recibió información de la proyección. Intente de nuevo.</p>
      </Layout>
    );
  }
  

  return (
    <Layout nombreProyeccion={proyeccionNombre}>
      <div className="container-edit">
        <MallaEditorDisplay 
        malla={malla}
        selectedSemestreId={seleccionado}
        onSelectSemestre={handleSelectSemestre}
        onDeleteAsignatura={handleDeleteAsignatura}
        semestreCredits={semestreCredits}
        />
        <div className="container-lateral">
        <CompBarraControlesProyeccion 
            onAddSemestre={handleAddSemestre}
            onSaveProyeccion={handleSaveProyeccion}
            onAutocompletar={handleAutocompletar}
          />
        <CompAsignaturasDisponibles 
        selectedSemestreId={seleccionado} 
        onAddAsignatura={handleAddAsignatura} 
        access_token={access_token} 
        indiceCarrera={indice}
        idProyeccion={proyeccionId || 0}
        malla ={malla}
        />
        </div>
      </div>
    </Layout>
    );
};
export default PagEditor;