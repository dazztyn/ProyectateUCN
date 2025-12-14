import Layout from '../componentes/componentesEditor/layoutWithBanner';
import { useLocation } from 'react-router-dom';
import React from 'react';
import { useState, useEffect } from 'react';
import MallaEditorDisplay from '../componentes/componentesEditor/compMallaEditor';
import type { 
  Proyeccion,
  AsignaturaDisponible
} from '../types/dataTypesEditor';

const calculateSemestreCredits = (malla: Proyeccion): Record<string, number> => {

  const creditosPorSemestre: Record<string, number> = {};
  for (const semestreKey in malla) {
    if (Object.prototype.hasOwnProperty.call(malla, semestreKey)) {

      const asignaturas = malla[semestreKey] || [];

      const totalCreditos = asignaturas.reduce((sum, asignatura) => {
        return sum + (asignatura.creditos || 0); 
      }, 0);

      creditosPorSemestre[semestreKey] = totalCreditos;
    }
  }

  return creditosPorSemestre;
};
const PagEditor = () => {
  const location = useLocation();
  const { data } = location.state ?? {};
  const proyeccion: Proyeccion = (data as Proyeccion);
  const [seleccionado, setSeleccionado] = React.useState<number | null>(null);

  const semestreCredits = React.useMemo(() => {
    return calculateSemestreCredits(proyeccion);
  }, [proyeccion]);
  const handleSelectSemestre = (semestreNumero: number) => {
    if (semestreNumero === seleccionado) return;
    setSeleccionado(semestreNumero);
    console.log("Semestre seleccionado:", semestreNumero);
  }
  if (!data) {
    return (
      <Layout>
        <p>Error: No se recibió información de la proyección. Intente de nuevo.</p>
      </Layout>
    );
  }
  useEffect(() => {
    if (seleccionado === null && Object.keys(proyeccion).length > 0) {
      setSeleccionado(Number(Object.keys(proyeccion)[0]));
    }
  }, [proyeccion, seleccionado]);
  return (
    <Layout>
        <MallaEditorDisplay 
        malla={data}
        selectedSemestreId={seleccionado}
        onSelectSemestre={handleSelectSemestre}
        semestreCredits={semestreCredits}
        />
    </Layout>
    );
};
export default PagEditor;