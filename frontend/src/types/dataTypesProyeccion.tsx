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
  period: string;
  student: string;
  course: Asignatura;
  excluded: boolean;
  inscriptionType: string;
  status: string;
};

export type Props = {
  indice: number;
  access_token: string;
};
export type ProyeccionGuardada = {
  id: number;
  nombre: string;
  esIdeal: boolean;
};