import logo from "../../assets/logoUCN.png";
import locoLogo from "../../assets/locoUCN.png";
import backIcon from "../../assets/backIcon.png";
import "../../style/styleBanner.css";
import React from 'react';
import { useNavigate } from 'react-router-dom';

const BarraSuperior: React.FC = () => {
    const navigate = useNavigate();
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
    <div className="banner">
        <div className="banner-left">
        <img src={logo} alt="Logo UCN" className="logo"/>
        <div className="wawa">Editor de proyecciones</div>
        </div>
        <div className="banner-right">
        <div className="back-button" onClick={() => handleNav('/proyeccion')}>
            <img src={backIcon} alt="Back Icon" className="icon-banner" />
        </div>
        </div>
      </div>
    );
}
export default BarraSuperior;