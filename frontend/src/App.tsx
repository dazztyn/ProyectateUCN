import { useState } from 'react'
import { Routes, Route } from "react-router-dom";
import './App.css'
import Malla from './paginas/mallaWIP';
import Avance from './paginas/avanceWIP';
import Proyeccion from './paginas/proyeccionWIP';
function App() {
  return (
    <Routes>
      <Route path="/malla" element={<Malla />} />
      <Route path="/avance" element={< Avance/>} />
      <Route path="/proyeccion" element={<Proyeccion />} />
    </Routes>

  )
}

export default App
