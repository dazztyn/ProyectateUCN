import React from "react";
import Sidebar from "./sidebarUser";

interface LayoutWithSidebarProps {
  children: React.ReactNode;
  nombreUser: string;
}

const LayoutWithSidebar: React.FC<LayoutWithSidebarProps> = ({ children, nombreUser }) => (
  <div style={{ display: "flex", minHeight: "100vh" }}>
    <Sidebar nombreUser={nombreUser} />
    <div style={{ flex: 1, background: "white", color: "black", padding: "2rem" }}>
      {children}
    </div>
  </div>
);

export default LayoutWithSidebar;