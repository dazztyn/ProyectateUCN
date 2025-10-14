import React from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../componentes/layoutWithSidebar';
import MallaCarrera from '../componentes/compMallaDisplay';

const Malla: React.FC = () => {
  const location = useLocation();
  const { indice, token } = location.state as { indice: number; token: string };

  return (
    <Layout nombreUser="Usuario" carreraUser="Carrera">
      <div>
        <h2>Malla Curricular - {}</h2>
        <MallaCarrera indice = {indice} token={token}/>
      </div>
    </Layout>
  );
};

export default Malla;