import React from "react";
import BarraSuperior from "./compBarraSuperior";

interface LayoutWithBannerProps {
  children: React.ReactNode;
  nombreProyeccion: string;
}

const LayoutWithBanner: React.FC<LayoutWithBannerProps> = ({ children, nombreProyeccion}) => (
  <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
    <BarraSuperior nombreProyeccion={nombreProyeccion}/>
    <main style={{ flex: 1, width: "100%", padding: "2rem", boxSizing: "border-box", flexDirection: "row", display: "flex", gap: "1rem" }}>
      {children}
    </main>
  </div>
);

export default LayoutWithBanner;