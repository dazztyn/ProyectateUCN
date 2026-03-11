

export type AsignaturaEditor = {
  codigo: string;
  nombre: string;
  estado: 'APROBADO' | 'REPROBADO' | 'PENDIENTE'; 
  creditos: number; 
  esExcepcion?: boolean;

};
export type AsignaturaDisponible = {
    codigo: string;
    nombre: string;
    creditos: number;
    nivel: number;
    puedeAgregar: boolean; 
    prereq: string;
    motivoNoDisponible?: string; 
};
export type SemestreEditor = {
  numero: number; 
  periodo: string;
  totalCreditos: number; 
  asignaturas: AsignaturaEditor[]; 
  editable: boolean;
};

export type FullProyeccionResponse = {
  id: number;
  rut: string;
  nombre: string;
  esIdeal: boolean;
  semestres: SemestreEditor[]; 
};

export type MallaEditorData = SemestreEditor[];

export type Props = {
  malla: MallaEditorData;
  selectedSemestreId: number | null; 
  onSelectSemestre: (semeestrePeriodo: number) => void; 
  semestreCredits: Record<string, number>;
  onDeleteAsignatura: (semestreNumero: number, codigoAsignatura: string) => void;

};

export type AsignaturaRawDisponible = {
    codigo: string;
    asignatura: string; 
    creditos: number;
    nivel: number;
    prereq: string;
};

export type AsignaturasDisponiblesResponse = {
    disponibles: AsignaturaRawDisponible[];
    noDisponibles: AsignaturaRawDisponible[];
};
export type AsignaturaInputDto = {
    codigo: string;
    nombre: string;
    creditos: number;
    estado?: string; 
};