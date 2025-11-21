import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  token: string | null;
  indiceCarrera: number;
  carreraActual: string;
  usuario: any;
  setIndiceCarrera: React.Dispatch<React.SetStateAction<number>>;
  setToken: React.Dispatch<React.SetStateAction<string | null>>;
}


const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [indiceCarrera, setIndiceCarrera] = useState<number>(0);
  const [carreraActual, setCarreraActual] = useState<string>("Ninguna seleccionada");
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    const sessionToken = sessionStorage.getItem("access_token");
    const savedIndex = Number(sessionStorage.getItem("indiceCarrera") || 0);

    if (sessionToken) {
      setToken(sessionToken);
      setIndiceCarrera(savedIndex);

      fetch("http://localhost:3000/alumno", {
        headers: { Authorization: `Bearer ${sessionToken}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setUsuario(data);
          setCarreraActual(
            data.carreras[savedIndex]?.nombre ?? "Ninguna seleccionada"
          );
        })
        .catch(console.error);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        indiceCarrera,
        carreraActual,
        usuario,
        setIndiceCarrera,
        setToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx)
    throw new Error("useAuth debe usarse dentro de un <AuthProvider>");
  return ctx;
}