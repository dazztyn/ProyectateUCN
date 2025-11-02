import React from "react";
import BarraSuperior from "./compBarraSuperior";

interface LayoutWithBannerProps {
  children: React.ReactNode;
}

const LayoutWithBanner: React.FC<LayoutWithBannerProps> = ({ children }) => (
  <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
    <BarraSuperior />
    <main style={{ flex: 1, width: "100%", padding: "2rem", boxSizing: "border-box" }}>
      {children}
    </main>
  </div>
);

export default LayoutWithBanner;