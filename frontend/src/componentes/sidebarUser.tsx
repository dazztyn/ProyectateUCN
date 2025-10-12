import logo from "../assets/logoUCN.png";
import locoLogo from "../assets/locoUCN.png";
import iconoHome from "../assets/home-icon-silhouette.png";
import iconoMalla from "../assets/menu.png";
import iconoProyeccion from "../assets/magic-ball.png";
import iconoAvance from "../assets/globe.png";
import React from 'react';
import '../style/sidebarStyle.css';
import { NavLink } from 'react-router-dom';

interface SidebarUserProps {
    nombreUser: string;
    carreraUser?: string;
}
const Sidebar: React.FC<SidebarUserProps> = ({ nombreUser }) => {
  return (
    <div className="sidebar">
      
      <div className="logo-container">
        <img src={logo} alt="Logo UCN" className="sidebar-logo" />
        <img src={locoLogo} alt="Logo loco UCN" className="sidebar-logo-hover" />
      </div>

      
      <div className="sidebar-username">{nombreUser}</div>

      {/* Links */}
      <nav className="sidebar-nav">
        
        <NavLink to="/malla" className="sidebar-link">
        <img src={iconoMalla} alt="icono Malla" className="icon" />
          Malla
        </NavLink>
        <NavLink to="/avance" className="sidebar-link">
        <img src={iconoAvance} alt="icono Avance" className="icon" />
          Avance
        </NavLink>
        <NavLink to="/proyeccion" className="sidebar-link">
        <img src={iconoProyeccion} alt="icono Proyección" className="icon" />
          Proyección
        </NavLink>
      </nav>
    </div>
  );
};


export default Sidebar;