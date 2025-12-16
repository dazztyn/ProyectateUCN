export type Asignatura = {
  codigo: string;
  asignatura: string;
  creditos: number;
  prereq: string[];
  nivel: number;
};

export type Semestre = {
  numero: number;
  asignaturas: Asignatura[];
};

export type Avance = {
  nrc: string;
  periodo: string;
  rut: string;
  codigo: string; 
  asignatura: string; 
  creditos: number; 
  estado: "APROBADO" | "REPROBADO" | "INSCRITO" | string;
  tipo: string;
};

export type AvanceData = Record<string, Avance[]>;

export type Props = {
  indice: string;
  access_token: string;
};