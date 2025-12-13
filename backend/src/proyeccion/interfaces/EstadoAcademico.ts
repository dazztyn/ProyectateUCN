import { Asignatura } from '../../ArchivosComunes/Asignatura.js';
import { AvanceConAsignatura } from '../../avance/avance/AvanceConAsignatura.js';

export interface EstadoAcademico {
    mallaCompleta: Asignatura[];
    mallaPorNiveles: Map<number, Asignatura[]>;
    avanceRelleno: AvanceConAsignatura[];
    avancePorPeriodo: Map<string, AvanceConAsignatura[]>;
    asignaturasAprobadas: Set<string>; // Usamos Set para búsquedas O(1)
    ultimoPeriodo: string;
    // Grafos pre-calculados para el algoritmo voraz
    grafoPrerrequisitos: Map<string, Asignatura[]>; 
}