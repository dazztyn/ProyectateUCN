import logo from "../assets/logoUCN.png";
import locoLogo from "../assets/locoUCN.png";
import iconoHome from "../assets/home-icon-silhouette.png";
import iconoMalla from "../assets/menu.png";
import iconoProyeccion from "../assets/magic-ball.png";
import iconoAvance from "../assets/globe.png";
import React from 'react';
import '../style/styleSidebar.css';
import { useNavigate } from 'react-router-dom';


const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const indiceCarrera = localStorage.getItem("indiceCarrera");
  const carreraActual =
    usuario?.carreras?.[Number(indiceCarrera)]?.nombre || "Ninguna seleccionada";

  const handleNav = (path: string) => {
    const access_token = localStorage.getItem("access_token");
    const indiceCarrera = localStorage.getItem("indiceCarrera");
    if (!access_token || indiceCarrera === null) {
      alert("Por favor selecciona una carrera antes de continuar.");
      navigate("/seleccion");
      return;
    }
    navigate(path, { state: { indice: Number(indiceCarrera), access_token } });
  };

  return (
    <div className="sidebar">
      <div className="logo-container">
        <img src={logo} alt="Logo UCN" className="sidebar-logo" />
        <img src={locoLogo} alt="Logo loco UCN" className="sidebar-logo-hover" />
      </div>

      <div className="sidebar-username">
        Bienvenid@ {usuario?.nombre || "Usuario"}
      </div>

      <div className="sidebar-career">
        Visualizando:
        <div className="sidebar-username">{carreraActual}</div>
      </div>

      <nav className="sidebar-nav">
        <button onClick={() => handleNav("/malla")} className="sidebar-link">
          <img src={iconoMalla} alt="icono Malla" className="icon" />
          Malla
        </button>
        <button onClick={() => handleNav("/avance")} className="sidebar-link">
          <img src={iconoAvance} alt="icono Avance" className="icon" />
          Avance
        </button>
        <button onClick={() => handleNav("/proyeccion")} className="sidebar-link">
          <img src={iconoProyeccion} alt="icono Proyección" className="icon" />
          Proyección
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;