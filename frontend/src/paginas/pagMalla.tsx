import React from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../componentes/layoutWithSidebar';
import MallaCarrera from '../componentes/compMallaDisplay';

const Malla: React.FC = () => {
  const location = useLocation();
  const { indice, access_token } = location.state as { indice: number; access_token: string };
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const indiceCarrera = localStorage.getItem("indiceCarrera");
  const carreraActual =
    usuario?.carreras?.[Number(indiceCarrera)]?.nombre || "Ninguna seleccionada";

  return (
    <Layout>
      <div>
        <h2>Malla Curricular - {carreraActual}</h2>
        <MallaCarrera indice = {indice} access_token={access_token}/>
      </div>
    </Layout>
  );
};

export default Malla;