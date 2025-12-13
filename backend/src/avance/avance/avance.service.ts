import { Injectable } from '@nestjs/common';
import { MallaService } from '../../mallacurricular/malla/malla.service';
import { RamoTomado } from './RamoTomado';
import { ErrorResponse } from '../../ArchivosComunes/ErrorResponse';
import { Asignatura } from '../../ArchivosComunes/Asignatura';
import { AvanceConAsignatura } from './AvanceConAsignatura';
import { AcademicUtilsService } from '../../ArchivosComunes/AcademicUtilsService';

@Injectable()
export class AvanceService 
{
    constructor(
        private readonly mallaService: MallaService,
        private readonly academicUtils: AcademicUtilsService
    ) {}

    async fetchAvanceData(rut:string, codigoCarrera:string): Promise<RamoTomado[]>
    {
        const url = `https://puclaro.ucn.cl/eross/avance/avance.php?rut=${rut}&codcarrera=${codigoCarrera}`;
        try 
        {
            const response = await fetch(url);
            
            if (!response.ok) 
            {
                throw new Error(`Error de red o servidor: ${response.status} ${response.statusText}`);
            }

            const data: RamoTomado[] | ErrorResponse = await response.json();

            if ('error' in data) 
            {
                throw new Error(data.error || 'Datos de avance no encontrados o Rut/Codigo de carrera incorrecto.');
            }

            return data;
        } 
        catch (error) 
        {
            console.error(`[fetchAvanceData] Falló la petición: ${error.message}`);
            throw error;
        }
    }

    // Reemplazo del HeapSort manual por el sort nativo de JS (Más rápido y legible)
    ordenarPorPeriodo(arr: AvanceConAsignatura[]): AvanceConAsignatura[] 
    {
        return arr.sort((a, b) => {
            // Compara strings (ej: "202310" vs "202410")
            if (a.getPeriod() > b.getPeriod()) return 1;
            if (a.getPeriod() < b.getPeriod()) return -1;
            return 0;
        });
    }

    verificarAsignatura(codigoAsignatura: string, malla: Asignatura[])
    {
        return this.mallaService.buscarAsignaturaEnMalla(codigoAsignatura, malla) || null;
    }

    rellenarListaDeAvance(avance: RamoTomado[], malla: Asignatura[]): AvanceConAsignatura[]
    {
        const listaDeAvance: AvanceConAsignatura[] = [];
        avance.forEach((ramo) =>
        {
            const asignatura = this.verificarAsignatura(ramo.course, malla);
            if(asignatura != null)
            {
                listaDeAvance.push(new AvanceConAsignatura(
                    ramo.nrc,
                    ramo.period,
                    ramo.student,
                    asignatura,
                    ramo.excluded,
                    ramo.inscriptionType,
                    ramo.status
                ));
            }
        });
        
        // Usamos el nuevo método de ordenamiento simplificado
        return this.ordenarPorPeriodo(listaDeAvance);
    }

    avanceSeparadoPorPeriodo(avance: AvanceConAsignatura[]): Map<string, AvanceConAsignatura[]>
    {
        // Usamos el utilitario genérico para agrupar
        return this.academicUtils.agruparPor(avance, (a) => a.getPeriod());
    }

    async getAvance(rutAlumno:string, codigoCarrera:string, catalogo:string)
    {
        const avance = await this.fetchAvanceData(rutAlumno,codigoCarrera);
        const malla = await this.mallaService.fetchMallaCarrera(codigoCarrera,catalogo);

        const listaDeAvanceConAsignatura = this.rellenarListaDeAvance(avance, malla);
        let avanceSeparado = this.avanceSeparadoPorPeriodo(listaDeAvanceConAsignatura);

        return Object.fromEntries(avanceSeparado);
    }

    sacarUltimoPeriodo(avancePorPeriodo: Map<string, AvanceConAsignatura[]>)
    {
        let keys = Array.from(avancePorPeriodo.keys());
        return keys[keys.length - 1];
    }
}