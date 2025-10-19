import { Injectable } from '@nestjs/common';
import { MallaService } from '../../mallacurricular/malla/malla.service.js';
import { RamoTomado } from './RamoTomado.js';
import { ErrorResponse } from 'src/ArchivosComunes/ErrorResponse.js';
import { Asignatura } from 'src/ArchivosComunes/Asignatura.js';
import { AvanceConAsignatura } from './AvanceConAsignatura.js';

@Injectable()
export class AvanceService 
{
    
    constructor(private readonly mallaService: MallaService) {}

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

    swap(arr: AvanceConAsignatura[], i: number, j: number): void 
    {
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }

    heapSort(arr: AvanceConAsignatura[]): AvanceConAsignatura[] 
    {
        const n = arr.length;

        for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
            this.heapify(arr, n, i);
        }

        for (let i = n - 1; i > 0; i--) {
            this.swap(arr, 0, i);
            this.heapify(arr, i, 0);
        }

        return arr;
    }

    heapify(arr: AvanceConAsignatura[], n: number, i: number): void 
    {
        let largest = i;
        const left = 2 * i + 1;
        const right = 2 * i + 2;

        if (left < n && arr[left].getPeriod() > arr[largest].getPeriod()) {
            largest = left;
        }

        if (right < n && arr[right].getPeriod() > arr[largest].getPeriod()) {
            largest = right;
        }

        if (largest !== i) {
            this.swap(arr, i, largest);
            this.heapify(arr, n, largest);
        }
    }

    verificarAsignatura(codigoAsignatura: string, malla: Asignatura[])
    {
        let asignatura = this.mallaService.buscarAsignaturaEnMalla(codigoAsignatura, malla)
        if(asignatura=== undefined)
        {
            return null;
        }
        else
        {
            return asignatura;
        }

    }

    rellenarListaDeAvance(avance: RamoTomado[], malla: Asignatura[])
    {
        const listaDeAvance: AvanceConAsignatura[] = [];
        avance.forEach((ramo) =>
        {
            
            listaDeAvance.push(new AvanceConAsignatura(
                ramo.nrc,
                ramo.period,
                ramo.student,
                this.verificarAsignatura(ramo.course, malla) as Asignatura,
                ramo.excluded,
                ramo.inscriptionType,
                ramo.status
            ));
        });
        return this.heapSort(listaDeAvance);
    }

    avanceSeparadoPorPeriodo(avance: AvanceConAsignatura[])
    {
        let hashmap = new Map<string, AvanceConAsignatura[]>();

        avance.forEach((avance) => 
        {
            let nivel = avance.getPeriod();
            if(!hashmap.has(nivel))
            {
                hashmap.set(nivel, []);
            }
            hashmap.get(nivel)?.push(avance);
        });

        return hashmap;
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
