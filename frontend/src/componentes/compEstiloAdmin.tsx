// compEstiloAdmin.tsx
import logo from "../assets/logoUCN.png";
import React from 'react';
import '../style/styleAdmin.css';
import { useNavigate } from 'react-router-dom';

const Topbar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("usuario");
    navigate("/");
  };

  return (
    <nav className="admin-banner">
      <div className="banner-left">
        <img src={logo} alt="Logo UCN" className="banner-logo" />
        <div className="banner-separator"></div>
        <span className="banner-welcome">
          Bienvenid@ <strong>Administrador</strong>
        </span>
      </div>

      <div className="banner-actions">
        <button onClick={handleLogout} className="btn-logout-admin">
          <span>Cerrar Sesión</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>
    </nav>
  );
};

export default Topbar;