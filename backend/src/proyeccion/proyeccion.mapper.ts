import { Injectable } from '@nestjs/common';
import { Asignatura } from '../ArchivosComunes/Asignatura.js';
import { AvancePlano } from './interfaces/EstadoAcademico.js';
import { CreacionSemestre } from './DtoProyeccion/CreacionSemestre.js';
import { CreacionInstanciaAsignatura } from './DtoProyeccion/CreacionInstanciaAsignatura.js';
import { CreacionAsignatura } from '../mallacurricular/dtoMallaCurricular/CreacionAsignatura.js';
import { Proyeccion } from './entities/proyeccion.entity';
import { ResponseProyeccionDto, ResponseSemestreDto } from './DtoProyeccion/ResponseProyeccion.dto';
import { ResponseProyeccionResumenDto } from './DtoProyeccion/ResponseProyeccionResumenDto.js';
@Injectable()
export class ProyeccionMapper {

    /**
     * Convierte la Malla (Asignatura[]) a DTOs para guardar en BD (CreacionAsignatura[])
     */
    toPersistenceCatalog(malla: Asignatura[], codigoCarrera: string): CreacionAsignatura[] {
        return malla.map(asig => ({
            codigoAsignatura: asig.codigo,
            codigoCarrera: codigoCarrera,
            nombreAsignatura: asig.asignatura,
            creditos: asig.creditos,
            nivel: asig.nivel,
            prerrequisitos: Array.isArray(asig.prereq) ? asig.prereq.join(',') : asig.prereq
        }));
    }

    /**
     * Convierte el Mapa de Avance Histórico a un Array de Semestres para TypeORM.
     * Incluye la lógica de numeración de semestres (saltando veranos y invierno 25/15).
     */
    avanceToPersistence(avanceMap: Map<string, AvancePlano[]>, codigoCarrera: string): CreacionSemestre[] {
        let numeroSemestre = 1;
        const arraySemestres: CreacionSemestre[] = [];

        // Ordenamos por periodo para asegurar secuencia cronológica
        const periodosOrdenados = Array.from(avanceMap.keys()).sort();

        for (const periodo of periodosOrdenados) {
            const asignaturas = avanceMap.get(periodo) || [];
            
            let creditosTotales = 0;
            const instancias: CreacionInstanciaAsignatura[] = asignaturas.map(item => {
                creditosTotales += item.creditos;
                return {
                    estado: item.estado, 
                    asignatura: 
                    { 
                        codigoAsignatura: item.codigo,
                        codigoCarrera: codigoCarrera
                    } 
                };
            });

            arraySemestres.push({
                numero: numeroSemestre,
                periodo: periodo,
                editable: false,
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
    futureToPersistence(futureMap: Map<string, Asignatura[]>, ultimoNumeroSemestre: number, codigoCarrera: string): CreacionSemestre[] {
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
                    estado: 'PENDIENTE', // En el futuro asumimos pendiente
                    asignatura: 
                    {
                        codigoAsignatura: asig.codigo,
                        codigoCarrera: codigoCarrera 
                    }
                };
            });

            arraySemestres.push({
                numero: numeroSemestre,
                periodo: periodo,
                editable: true,
                totalCreditos: creditosTotales,
                instancias: instancias
            });

            numeroSemestre++;
        }
        return arraySemestres;
    }

    /**
     * Convierte una Entidad de BD a un DTO de Respuesta limpio para el Frontend
     */
    toResponse(entidad: Proyeccion): ResponseProyeccionDto {
        // Ordenamos semestres por si la BD los trae desordenados
        const semestresOrdenados = entidad.semestres 
            ? entidad.semestres.sort((a, b) => a.numero - b.numero) 
            : [];

        const semestresDto: ResponseSemestreDto[] = semestresOrdenados.map(semestre => ({
            numero: semestre.numero,
            periodo: semestre.periodo,
            totalCreditos: semestre.totalCreditos,
            // Mapeamos las instancias (asignaturas dentro del semestre)
            asignaturas: semestre.instancias ? semestre.instancias.map(instancia => ({
                codigo: instancia.asignatura.codigoAsignatura,
                nombre: instancia.asignatura.nombreAsignatura,
                creditos: instancia.asignatura.creditos,
                estado: instancia.estado as 'APROBADO' | 'PENDIENTE' | 'REPROBADO'
            })) : []
        }));

        return {
            id: entidad.idProyeccion,
            rut: entidad.rutUsuario,
            nombre: entidad.nombreProyeccion,
            esIdeal: entidad.ideal,
            semestres: semestresDto
        };
    }

    /**
     * Versión para listas (Arrays)
     */
    toResponseList(entidades: Proyeccion[]): ResponseProyeccionDto[] {
        return entidades.map(entidad => this.toResponse(entidad));
    }

    toSummaryResponse(entidad: Proyeccion): ResponseProyeccionResumenDto 
    {
        return {
            id: entidad.idProyeccion,
            nombre: entidad.nombreProyeccion,
            esIdeal: entidad.ideal,
        };
    }
    toSummaryResponseList(entidades: Proyeccion[]): ResponseProyeccionResumenDto[] 
    {
        return entidades.map(e => this.toSummaryResponse(e));
    }
}