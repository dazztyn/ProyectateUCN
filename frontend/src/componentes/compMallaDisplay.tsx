import React, { useState, useEffect } from "react";
import ErrorMessage from "./compMensajeError";
import '../style/styleMalla.css';

type Asignatura = {
  codigo: string;
  asignatura: string;
  creditos: number;
  prereq: string[];
  nivel: number;
};

type Semestre = {
  numero: number;
  asignaturas: Asignatura[];
};

type Props = {
  indice: number;
  access_token: string;
};

const MallaCarrera: React.FC<Props> = ({ indice, access_token}) => {
  const [semestres, setSemestres] = useState<Semestre[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const obtenerMalla = async () => {
      try {
        setCargando(true);
        setError("");

        const res = await fetch(`http://localhost:3000/malla/${indice}`, {
  headers: {
    Authorization: `Bearer ${access_token}`,  
  },
});
        if (!res.ok) throw new Error("No se pudo obtener la malla curricular.");
        const data: Record<string, Asignatura[]> = await res.json();

       
        const semestresArray: Semestre[] = Object.entries(data).map(
          ([num, asignaturas]) => ({
            numero: Number(num),
            asignaturas: asignaturas.map(a => ({
              ...a,
              prereq: a.prereq
                ? Array.isArray(a.prereq)
                  ? a.prereq
                  : (a.prereq as string).split(",")
                : [],
            })),
          })
        );

        setSemestres(semestresArray);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    obtenerMalla();
  }, [ indice, access_token ]);

 
  if (cargando) return <p className="loading">Cargando malla...</p>;
  if (error) return <ErrorMessage message={error} />;
  if (!semestres.length) return <p className="error">No se encontraron semestres.</p>;

  return (
    <div className="malla-container">
      {semestres.map(sem => (
        <div key={sem.numero} className="semestre-card">
          <div className="semestre-titulo-container">{sem.numero}° Sem.</div>
          <div className="asignaturas-grid">
          {sem.asignaturas.map(a => (
            <div key={a.codigo} className="asignatura-card">
              <h3>{a.codigo}</h3>
              <h4>{a.asignatura}</h4>
              <h3>Créditos: {a.creditos}</h3>
            </div>
          ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MallaCarrera;