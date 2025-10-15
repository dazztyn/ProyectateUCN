import React from "react";
import Sidebar from "./compSidebarUser";

interface LayoutWithSidebarProps {
  children: React.ReactNode;
}

const LayoutWithSidebar: React.FC<LayoutWithSidebarProps> = ({ children}) => (
  <div style={{ display: "flex", maxHeight: "100vh" }}>
    <Sidebar/>
    <div style={{ flex: 1, color: "black", padding: "2rem" }}>
      {children}
    </div>
  </div>
);

export default LayoutWithSidebar;