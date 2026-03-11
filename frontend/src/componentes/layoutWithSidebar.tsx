import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./compSidebarUser";

interface LayoutWithSidebarProps {
  children: React.ReactNode;
}

const LayoutWithSidebar: React.FC<LayoutWithSidebarProps> = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    switch (location.pathname) {
      case "/malla":
        document.title = "Malla Curricular — Proyéctate UCN";
        break;
      case "/proyeccion":
        document.title = "Proyección Académica — Proyéctate UCN";
        break;
      case "/avance":
        document.title = "Avance Académico — Proyéctate UCN";
        break;
      default:
        document.title = "Proyéctate UCN";
    }
  }, [location.pathname]);

  return (
    <div style={{ display: "flex"}}>
      <Sidebar />
      <div style={{ flex: 1, color: "black", padding: "2rem" }}>
        {children}
      </div>
    </div>
  );
};

export default LayoutWithSidebar;