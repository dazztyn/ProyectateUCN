import logo from "../assets/logoUCN.png";
import locoLogo from "../assets/locoUCN.png";
import React from 'react';
import './sidebarStyle.css';
import { NavLink } from 'react-router-dom';

interface SidebarUserProps {
    nombreUser: string;
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
          Malla
        </NavLink>
        <NavLink to="/avance" className="sidebar-link">
          Avance
        </NavLink>
        <NavLink to="/proyeccion" className="sidebar-link">
          Proyección
        </NavLink>
      </nav>
    </div>
  );
};


export default Sidebar;