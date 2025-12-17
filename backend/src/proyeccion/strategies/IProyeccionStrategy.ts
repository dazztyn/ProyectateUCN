import { Asignatura } from '../../ArchivosComunes/Asignatura.js';
import { EstadoAcademico } from '../interfaces/EstadoAcademico.js';

export interface IProyeccionStrategy 
{
    /**
     * Ejecuta el algoritmo de proyección.
     * @param estado Todos los datos preparados del alumno (malla, avance, grafos).
     * @returns Mapa con la proyección: "202410" -> [Cálculo, Progra...]
     */
    generar(): Map<string, Asignatura[]>;
}