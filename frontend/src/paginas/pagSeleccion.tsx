import React from "react"; 
import {useState, useEffect} from "react"; 
import { useNavigate } from 'react-router-dom'; 
import ErrorMessage from '../componentes/compMensajeError';
import logo from '../assets/logoUCN.png';
import '../style/styleLogin.css'; 
import axios from "axios";

type Carrera = {
     nombre: string; 
     codigo: string; 
     catalogo: string; }; 


const SeleccionCarrera: React.FC = () => {

  const navigate = useNavigate();
  const access_token = localStorage.getItem("access_token");

  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [selectedCarrera, setSelectedCarrera] = useState<Carrera | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // Redirige a login si no hay token
  useEffect(() => {
    if (!access_token) {
      navigate("/login");
    }
  }, [access_token, navigate]);

  // Obtener carreras del usuario 
  useEffect(() => {
    document.title = "Selección — Proyéctate UCN";

    if (!access_token) return;

    const fetchUsuario = async () => {
      try {
        const res = await axios.post(
          "http://localhost:3000/alumno",
          {},
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          }
        );

        setCarreras(res.data.carreras || []);
      } catch (err: any) {
        setError("No se pudo obtener la información del usuario.");
        navigate("/login");
      }
    };

    fetchUsuario();
  }, [access_token, navigate]);

  const handleGo = () => {
    if (!selectedCarrera || !selectedSection) {
      setError("Debe seleccionar una sección y una carrera.");
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
    <img
        src={logo}
        alt="Logo de la Universidad Católica del Norte"
        className="logo-ucn"
      />
    <div className="fondo-franja">
    <div className="fondo-contenido">
    <div className="seleccion-container"
          role="form"
          aria-labelledby="titulo-seleccion">

      <h2 id="titulo-seleccion">Selecciona tu sección y carrera</h2>

      {error && <ErrorMessage message={error} onClose={() => setError(null)}/>}
      <div className="botones-seccion" role="group" aria-label="Secciones disponibles">
        {["malla", "avance", "proyeccion"].map((sec) => (
          <button
            key={sec}
            onClick={() => setSelectedSection(sec)}
            className={`boton-seccion ${
              selectedSection === sec ? "activo" : ""
            }`}
            aria-pressed={selectedSection === sec}
          >
            {sec.charAt(0).toUpperCase() + sec.slice(1)}
          </button>
        ))}
      </div>

      <div className="bloque-carrera" onClick={() => setOpen(!open)}
        role="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Selector de carreras">
        {selectedCarrera
          ? selectedCarrera.nombre
          : "Haz click para elegir una carrera"}
      </div>

      {open && (
        <ul className="lista-carreras"
            role="listbox"
            aria-label="Lista de carreras disponibles">
          {carreras.map((c, i) => (
            <li
              key={c.codigo}
              role="option"
              aria-selected={selectedCarrera?.codigo === c.codigo}
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

      <button onClick={handleGo} className="boton-ir" aria-label="Ir a la sección seleccionada">
        Ir
      </button>
    </div>
    </div>
    </div>
    </div>
  );
};

export default SeleccionCarrera;