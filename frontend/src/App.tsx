import { useState } from 'react'
import { Routes, Route } from "react-router-dom";
import './style/App.css'
import Malla from './paginas/pagMalla';
import Avance from './paginas/pagAvance';
import Proyeccion from './paginas/pagProyeccion';
import Login from './paginas/pagLogin';
function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login/>} />
      <Route path="/malla" element={<Malla />} />
      <Route path="/avance" element={< Avance/>} />
      <Route path="/proyeccion" element={<Proyeccion />} />
    </Routes>

  )
}

export default App
