import { Injectable } from '@nestjs/common';
import { Asignatura } from '../ArchivosComunes/Asignatura.js';
import { AvanceConAsignatura } from '../avance/avance/AvanceConAsignatura.js';
import { CreacionSemestre } from './DtoProyeccion/CreacionSemestre.js';
import { CreacionInstanciaAsignatura } from './DtoProyeccion/CreacionInstanciaAsignatura.js';
import { CreacionAsignatura } from './DtoProyeccion/CreacionAsignatura.js';

@Injectable()
export class ProyeccionMapper {

    /**
     * Convierte la Malla (Asignatura[]) a DTOs para guardar en BD (CreacionAsignatura[])
     */
    toPersistenceCatalog(malla: Asignatura[]): CreacionAsignatura[] {
        return malla.map(asig => ({
            codigoAsignatura: asig.codigo,
            nombreAsignatura: asig.asignatura,
            creditos: asig.creditos,
            nivel: asig.nivel,
            prerrequisitos: asig.prereq
        }));
    }

    /**
     * Convierte el Mapa de Avance Histórico a un Array de Semestres para TypeORM.
     * Incluye la lógica de numeración de semestres (saltando veranos y invierno 25/15).
     */
    avanceToPersistence(avanceMap: Map<string, AvanceConAsignatura[]>): CreacionSemestre[] {
        let numeroSemestre = 1;
        const arraySemestres: CreacionSemestre[] = [];

        // Ordenamos por periodo para asegurar secuencia cronológica
        const periodosOrdenados = Array.from(avanceMap.keys()).sort();

        for (const periodo of periodosOrdenados) {
            const asignaturas = avanceMap.get(periodo) || [];
            
            let creditosTotales = 0;
            const instancias: CreacionInstanciaAsignatura[] = asignaturas.map(item => {
                const asig = item.getCourse();
                creditosTotales += asig.creditos;

                return {
                    aprobada: (item.getStatus() === 'APROBADO'),
                    asignatura: { codigoAsignatura: asig.codigo }
                };
            });

            arraySemestres.push({
                numero: numeroSemestre,
                periodo: periodo,
                totalCreditos: creditosTotales,
                instancias: instancias
            });

            // Lógica de incremento de semestre (No incrementa en veranos 15/25)
            const tipoSemestre = periodo.slice(4, 6);
            if (tipoSemestre !== '15' && tipoSemestre !== '25') {
                numeroSemestre++;
            }
        }
        return arraySemestres;
    }

    /**
     * Convierte el Mapa de Proyección Futura a un Array de Semestres para TypeORM.
     * Continúa la numeración desde el último semestre del avance.
     */
    futureToPersistence(futureMap: Map<string, Asignatura[]>, ultimoNumeroSemestre: number): CreacionSemestre[] {
        let numeroSemestre = ultimoNumeroSemestre;
        const arraySemestres: CreacionSemestre[] = [];
        
        // Ordenamos por periodo
        const periodosOrdenados = Array.from(futureMap.keys()).sort();

        for (const periodo of periodosOrdenados) {
            const asignaturas = futureMap.get(periodo) || [];
            
            let creditosTotales = 0;
            const instancias: CreacionInstanciaAsignatura[] = asignaturas.map(asig => {
                creditosTotales += asig.creditos;
                return {
                    aprobada: true, // En el futuro asumimos aprobación
                    asignatura: { codigoAsignatura: asig.codigo }
                };
            });

            arraySemestres.push({
                numero: numeroSemestre,
                periodo: periodo,
                totalCreditos: creditosTotales,
                instancias: instancias
            });

            numeroSemestre++;
        }
        return arraySemestres;
    }
}