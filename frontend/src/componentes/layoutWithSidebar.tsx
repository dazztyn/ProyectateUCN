import React from "react";
import Sidebar from "./compSidebarUser";

interface LayoutWithSidebarProps {
  children: React.ReactNode;
  nombreUser: string;
  carreraUser: string;
}

const LayoutWithSidebar: React.FC<LayoutWithSidebarProps> = ({ children, nombreUser, carreraUser }) => (
  <div style={{ display: "flex", maxHeight: "100vh" }}>
    <Sidebar nombreUser={nombreUser} carreraUser={carreraUser} />
    <div style={{ flex: 1, color: "black", padding: "2rem" }}>
      {children}
    </div>
  </div>
);

export default LayoutWithSidebar;