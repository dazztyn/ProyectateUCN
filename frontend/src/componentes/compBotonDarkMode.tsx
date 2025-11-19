import React from "react";
import { useTheme } from "../contexts/ThemeContext";

const ToggleThemeButton: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label="Alternar tema"
      className="button-accent"
      style={{ display: "inline-flex", gap: 8, alignItems: "center" }}
    >
      {theme === "dark" ? "☀️" : "🌙"}
      <span style={{ fontSize: 14 }}>{theme === "dark" ? "Claro" : "Oscuro"}</span>
    </button>
  );
};

export default ToggleThemeButton;