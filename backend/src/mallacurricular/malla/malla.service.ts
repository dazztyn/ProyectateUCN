import { Injectable } from '@nestjs/common';
import { Asignatura } from '../../ArchivosComunes/Asignatura';
import { RamoInfo } from '../../ArchivosComunes/RamoInfo';
import { AcademicUtilsService } from '../../ArchivosComunes/AcademicUtilsService';

@Injectable()
export class MallaService 
{
    constructor(private readonly academicUtils: AcademicUtilsService) {}

    async fetchMallaCarrera(codigoCarrera: string, catalogo: string): Promise<Asignatura[]>
    {
        const url = `https://losvilos.ucn.cl/hawaii/api/mallas?${codigoCarrera}-${catalogo}`;

        try 
        {
            const response = await fetch(url, {headers: {'X-HAWAII-AUTH': 'jf400fejof13f'},});

            if (!response.ok) 
            {
                throw new Error(`Error de red o servidor: ${response.status} ${response.statusText}`);
            }

            const data: Asignatura[] = await response.json();

            if (data.length == 0) 
            {
                throw new Error('Malla no encontrada o Catalogo/Codigo de carrera incorrecto');
            }

            // Usamos el servicio de utilidades para limpiar
            return this.academicUtils.limpiarPrerrequisitosInvalidos(data);
        } 
        catch (error) 
        {
            console.error(`[fetchMallaCarrera] Falló la petición: ${error.message}`);
            throw error;
        }
    }
    
    private agregarListaDeAsignaturasQueAbre(mallaPorNiveles: Map<number, Asignatura[]>, mallaCompleta: Asignatura[])
    {
        let nuevaMalla: Map<number, RamoInfo[]> = new Map<number, RamoInfo[]>();

        // Usamos utils para obtener los grafos pre-calculados
        const grafoApertura = this.academicUtils.construirGrafoDeApertura(mallaCompleta);
        const grafoPrerrequisitos = this.academicUtils.obtenerObjetosPrerrequisitos(mallaCompleta);

        let nuevaListaRamos: RamoInfo[] = [];

        for (const [nivel, asignaturas] of mallaPorNiveles.entries())
        {
            for(let asig of asignaturas)
            {
                const nuevoRamo = new RamoInfo(asig.codigo, asig.asignatura, asig.creditos, asig.nivel);
                
                // Obtenemos la info directamente de los mapas generados por utils
                const listaDeAsignaturasQueAbre = grafoApertura.get(asig.codigo) || [];
                const listaPrerrequisitos = grafoPrerrequisitos.get(asig.codigo) || [];
                
                nuevoRamo.rellenarAsignaturasQueAbre(listaDeAsignaturasQueAbre);
                nuevoRamo.rellenarPrerrequisitos(listaPrerrequisitos);
                
                nuevaListaRamos.push(nuevoRamo);
            }
            nuevaMalla.set(nivel, nuevaListaRamos);
            nuevaListaRamos = [];
        }
        return nuevaMalla;
    }

    async getMalla(codigoCarrera: string, catalogo: string)
    {
        const malla = await this.fetchMallaCarrera(codigoCarrera, catalogo);

        // Usamos utils para agrupar por nivel
        let mallaSeparada = this.academicUtils.agruparPor(malla, (a) => a.nivel);
    
        // Pasamos tanto la malla agrupada como la completa para los cálculos de grafos
        const mallaInfo = this.agregarListaDeAsignaturasQueAbre(mallaSeparada, malla);

        return Object.fromEntries(mallaInfo);
    }
}