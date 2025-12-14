export type Asignatura = {
  codigoAsignatura: string;
  nombreAsignatura: string;
  creditos: number;
  nivel: number;
  prerrequisitos: string;
};
export type Semestre = {
  numero: number;
  asignaturas: Asignatura[];
};

export type Props = {
  malla: Record<string, Asignatura[]>;
  selectedSemestreId: number | null; 
  onSelectSemestre: (semestreNumero: number) => void; 
  semestreCredits: Record<string, number>;
};

export type Proyeccion = Record<string, Asignatura[]>;

export type AsignaturaDisponible = Asignatura & {
  id: number; 
  puedeAgregar: boolean; 
  motivoNoDisponible?: string; 
};