// LayoutAdmin.tsx
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Topbar from "./compEstiloAdmin";

interface LayoutProps {
  children: React.ReactNode;
}

const LayoutAdmin: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    document.title = location.pathname === "/estadisticas" 
      ? "Estadísticas — Proyéctate UCN" 
      : "Panel Admin — Proyéctate UCN";
  }, [location.pathname]);

  return (
    <div className="admin-page-wrapper">
      <Topbar />
      <main className="admin-content-area">
        {children}
      </main>
    </div>
  );
};

export default LayoutAdmin;