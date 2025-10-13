import React from 'react';
import Layout from '../componentes/layoutWithSidebar';
import MallaCarrera from '../componentes/compMallaDisplay';

const Malla: React.FC = () => {
  const codigoCarrera = "8606";  
  const catalogo = "201610"; 
  return (
    <Layout nombreUser="Usuario Ejemplo" carreraUser = "Ingeniería en ser weon">
    <div>
      <h2>Malla Curricular</h2>
      <MallaCarrera codigoCarrera={codigoCarrera} catalogo={catalogo} />
    </div>
    </Layout>
  );
}


export default Malla;