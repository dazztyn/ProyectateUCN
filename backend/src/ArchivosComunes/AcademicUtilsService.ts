import { Injectable } from '@nestjs/common';
import { Asignatura } from './Asignatura';
import { AvanceConAsignatura } from '../avance/avance/AvanceConAsignatura';

@Injectable()
export class AcademicUtilsService {

    /**
     * Limpia los prerrequisitos que apuntan a asignaturas que no existen en la malla actual.
     * (Movido desde MallaService)
     */
    limpiarPrerrequisitosInvalidos(malla: Asignatura[]): Asignatura[] {
        const codigosValidos = new Set(malla.map(a => a.codigo));

        return malla.map((asignatura) => {
            if (!asignatura.prereq) return asignatura;

            const prerequisitosLimpios = asignatura.prereq
                .split(',')
                .filter(codigo => codigosValidos.has(codigo));
            
            return {
                ...asignatura,
                prereq: prerequisitosLimpios.join(','),
            };
        });
    }

    /**
     * Genera un mapa donde la clave es el código de asignatura y el valor
     * son las asignaturas que TIENEN a esa clave como prerrequisito.
     * (Es decir, "qué ramos abro").
     * (Movido y renombrado desde MallaService: asignaturasCantidadAparicionesPrerrequisitos)
     */
    construirGrafoDeApertura(malla: Asignatura[]): Map<string, Asignatura[]> {
        const grafo = new Map<string, Asignatura[]>();

        // Inicializar mapa
        malla.forEach(a => grafo.set(a.codigo, []));

        // Llenar grafo
        malla.forEach((asignatura) => {
            if (asignatura.prereq) {
                const prerrequisitos = asignatura.prereq.split(",");
                prerrequisitos.forEach((codigoPrereq) => {
                    grafo.get(codigoPrereq)?.push(asignatura);
                });
            }
        });
        return grafo;
    }

    /**
     * Convierte el string de prerrequisitos en una lista de objetos Asignatura.
     * (Movido desde MallaService)
     */
    obtenerObjetosPrerrequisitos(malla: Asignatura[]): Map<string, Asignatura[]> {
        const mapa = new Map<string, Asignatura[]>();
        // Crear un mapa de búsqueda rápida para evitar .find() repetitivo
        const diccionarioMalla = new Map(malla.map(a => [a.codigo, a]));

        malla.forEach(a => mapa.set(a.codigo, []));

        malla.forEach((asignatura) => {
            if (asignatura.prereq) {
                const codigos = asignatura.prereq.split(",");
                const listaObjetos = codigos
                    .map(cod => diccionarioMalla.get(cod))
                    .filter((a): a is Asignatura => a !== undefined); // Type guard para eliminar undefined
                
                mapa.set(asignatura.codigo, listaObjetos);
            }
        });
        return mapa;
    }

    agruparPor<T, K>(items: T[], keySelector: (item: T) => K): Map<K, T[]> 
    {
        const mapa = new Map<K, T[]>();
        items.forEach((item) => {
            const key = keySelector(item);
            if (!mapa.has(key)) {
                mapa.set(key, []);
            }
            mapa.get(key)?.push(item);
        });
        return mapa;
    }

    obtenerCodigosAprobados(avance: AvanceConAsignatura[]): Set<string> 
    {
        const aprobadas = new Set<string>();
        
        avance.forEach(item => {
            if (item && item.getCourse() && (item.getStatus() === 'APROBADO' || item.getStatus() === 'INSCRITO')) {
                aprobadas.add(item.getCourse().codigo);
            }
        });
        
        return aprobadas;
    }
    buscarAsignatura(codigo: string, malla: Asignatura[]): Asignatura | undefined
    {
        return malla.find((asignatura) => asignatura.codigo === codigo);
    }
}