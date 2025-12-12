import Layout from '../componentes/componentesEditor/layoutWithBanner';
import { useLocation } from 'react-router-dom';
import MallaEditorDisplay from '../componentes/componentesEditor/compMallaEditor';

const PagEditor = () => {
  const location = useLocation();
  const { data } = location.state ?? {};

  if (!data) {
    return (
      <Layout>
        <p>Error: No se recibió información de la proyección.</p>
      </Layout>
    );
  }
  return (
    <Layout>
        <MallaEditorDisplay malla={data} />
    </Layout>
    );
};
export default PagEditor;