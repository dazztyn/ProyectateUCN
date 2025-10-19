import React from "react"; 
import {useState} from "react"; 
import { useNavigate } from 'react-router-dom'; 
import logo from '../assets/logoUCN.png';
import '../style/styleLogin.css'; 

type Carrera = {
     nombre: string; 
     codigo: string; 
     catalogo: string; }; 


const SeleccionCarrera: React.FC = () => {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const access_token = localStorage.getItem("access_token");
  const carreras: Carrera[] = usuario?.carreras || [];

  const [selectedCarrera, setSelectedCarrera] = useState<Carrera | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleGo = () => {
    if (!selectedCarrera || !selectedSection) {
      alert("Debe seleccionar una sección y una carrera.");
      return;
    }

    const index = carreras.findIndex((c) => c.codigo === selectedCarrera.codigo);
    localStorage.setItem("indiceCarrera", index.toString());

    navigate(`/${selectedSection}`, {
      state: { indice: index, access_token },
    });
  };

  return (
    <div className="cuerpoLogin">
    <img src={logo} alt="Logo UCN" className="logo" />
    <div className="fondo-franja">
    <div className="fondo-contenido">
    <div className="seleccion-container">
      <h2>Selecciona tu sección y carrera</h2>

      
      <div className="botones-seccion">
        {["malla", "avance", "proyeccion"].map((sec) => (
          <button
            key={sec}
            onClick={() => setSelectedSection(sec)}
            className={`boton-seccion ${
              selectedSection === sec ? "activo" : ""
            }`}
          >
            {sec.charAt(0).toUpperCase() + sec.slice(1)}
          </button>
        ))}
      </div>

      <div className="bloque-carrera" onClick={() => setOpen(!open)}>
        {selectedCarrera
          ? selectedCarrera.nombre
          : "Haz click para elegir una carrera"}
      </div>

      {open && (
        <ul className="lista-carreras">
          {carreras.map((c, i) => (
            <li
              key={c.codigo}
              onClick={() => {
                setSelectedCarrera(c);
                setOpen(false);
              }}
            >
              {c.nombre}
            </li>
          ))}
        </ul>
      )}

      <button onClick={handleGo} className="boton-ir">
        Ir
      </button>
    </div>
    </div>
    </div>
    </div>
  );
};

export default SeleccionCarrera;