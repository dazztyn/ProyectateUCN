import { Injectable } from '@nestjs/common';
import { Asignatura } from '../../ArchivosComunes/Asignatura';
import { RamoInfo } from '../../ArchivosComunes/RamoInfo';
import { AcademicUtilsService } from '../../ArchivosComunes/AcademicUtilsService';
import { Asignaturas } from '../entities/asignatura.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class MallaService 
{
    constructor(private readonly academicUtils: AcademicUtilsService,
        @InjectRepository(Asignaturas)
        private readonly asignaturaRepo: Repository<Asignaturas>,
    ) {}

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
 
    //Sincronizar (API -> BD)
    async sincronizarMalla(codigoCarrera: string, catalogo: string): Promise<void> 
    {
        // A. Descargamos la data fresca
        const mallaApi = await this.fetchMallaCarrera(codigoCarrera, catalogo);

        // B. Convertimos de Interfaz (Asignatura) a Entidad (Asignaturas)
        // Ojo con el cambio de nombre: prereq -> prerrequisitos
        const entidadesAGuardar = mallaApi.map(ramo => {
            return this.asignaturaRepo.create({
                codigoAsignatura: ramo.codigo,
                codigoCarrera: codigoCarrera,
                nombreAsignatura: ramo.asignatura, // nombre en interfaz es 'asignatura'
                creditos: ramo.creditos,
                nivel: ramo.nivel,
                prerrequisitos: ramo.prereq // Mapeo manual
            });
        });

        // C. Guardar (Upsert)
        // TypeORM detecta por la PrimaryKey (codigoAsignatura). 
        // Si existe, actualiza. Si no, inserta.
        if (entidadesAGuardar.length > 0) {
            await this.asignaturaRepo.save(entidadesAGuardar);
            console.log(`✅ Malla sincronizada: ${entidadesAGuardar.length} asignaturas guardadas.`);
        }
    }

    async obtenerMallaRaw(codigoCarrera: string): Promise<Asignatura[]> 
    {
        // Si tienes varias carreras, aquí podrías filtrar con un where: { codigoCarrera } si agregas esa columna.
        const asignaturasBD = await this.asignaturaRepo.find({
            where: { codigoCarrera: codigoCarrera } 
        }); 

        // Convertimos Entidad -> Interfaz Plana
        return asignaturasBD.map(entidad => ({
            codigo: entidad.codigoAsignatura,
            asignatura: entidad.nombreAsignatura,
            creditos: entidad.creditos,
            nivel: entidad.nivel,
            prereq: entidad.prerrequisitos // String
        }));
    }

    // 3. NUEVO: Leer de BD (BD -> Interfaz)
    async obtenerMallaDesdeBD(codigoCarrera: string) // Quité el Promise<Asignatura[]> estricto para permitir el formato rico
    {
        const listaPlana = await this.obtenerMallaRaw(codigoCarrera);

        const grafoApertura = this.academicUtils.construirGrafoDeApertura(listaPlana);

        const listaEnriquecida = listaPlana.map(ramo => {
            
            const prereqArray = ramo.prereq && ramo.prereq.length > 0 
                ? ramo.prereq.split(',') 
                : [];

            return {
                ...ramo, 
                prereq: prereqArray,
                asignaturasQueAbre: grafoApertura.get(ramo.codigo) || []
            };
        });

        const mallaAgrupada = this.academicUtils.agruparPor(listaEnriquecida, (ramo) => ramo.nivel);

        return Object.fromEntries(mallaAgrupada);
    }
    
}