import { Asignatura } from '../../ArchivosComunes/Asignatura.js';
import { AvanceConAsignatura } from '../../avance/avance/AvanceConAsignatura.js';

export interface AvancePlano 
{
    nrc: string;
    periodo: string;
    rut: string;
    codigo: string;
    asignatura: string; 
    creditos: number;  
    estado: string;  
    tipo: string;
}

export interface EstadoAcademico 
{
    mallaCompleta: Asignatura[];
    mallaPorNiveles: Map<number, Asignatura[]>;
    avancePorPeriodo: Map<string, AvancePlano[]>; 
    avancePlanoLista: AvancePlano[]; 
    asignaturasAprobadas: Set<string>; 
    ultimoPeriodo: string;
    grafoPrerrequisitos: Map<string, Asignatura[]>;
}