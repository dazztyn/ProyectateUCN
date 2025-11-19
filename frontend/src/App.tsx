
import { Routes, Route } from "react-router-dom";
import './App.css'
import Malla from './paginas/pagMalla';
import Avance from './paginas/pagAvance';
import Proyeccion from './paginas/pagProyeccion';
import Login from './paginas/pagLogin';
import SeleccionCarrera from './paginas/pagSeleccion';
import PagEditor from './paginas/pagEditor';
function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login/>} />
      <Route path="/malla" element={<Malla />} />
      <Route path="/avance" element={<Avance/>} />
      <Route path="/editor" element={<PagEditor/>} />
      <Route path="/proyeccion" element={<Proyeccion/>} />
      <Route path="/seleccion" element={<SeleccionCarrera />} />
      <Route path="*" element={<Login />} />
    </Routes>

  )
}

export default App
