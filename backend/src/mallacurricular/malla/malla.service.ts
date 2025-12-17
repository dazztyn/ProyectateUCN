import { Injectable, NotFoundException } from '@nestjs/common';
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

            return this.academicUtils.limpiarPrerrequisitosInvalidos(data);
        } 
        catch (error) 
        {
            console.error(`[fetchMallaCarrera] Falló la petición: ${error.message}`);
            throw error;
        }
    }
 
    async sincronizarMalla(codigoCarrera: string, catalogo: string): Promise<void> 
    {
        const mallaApi = await this.fetchMallaCarrera(codigoCarrera, catalogo);
        const entidadesAGuardar = mallaApi.map(ramo => {
            return this.asignaturaRepo.create({
                codigoAsignatura: ramo.codigo,
                codigoCarrera: codigoCarrera,
                nombreAsignatura: ramo.asignatura,
                creditos: ramo.creditos,
                nivel: ramo.nivel,
                prerrequisitos: ramo.prereq
            });
        });
        if (entidadesAGuardar.length > 0) {
            await this.asignaturaRepo.save(entidadesAGuardar);
            console.log(`✅ Malla sincronizada: ${entidadesAGuardar.length} asignaturas guardadas.`);
        }
    }

    async obtenerMallaRaw(codigoCarrera: string): Promise<Asignatura[]> 
    {
        const asignaturasBD = await this.asignaturaRepo.find({
            where: { codigoCarrera: codigoCarrera } 
        }); 

        return asignaturasBD.map(entidad => ({
            codigo: entidad.codigoAsignatura,
            asignatura: entidad.nombreAsignatura,
            creditos: entidad.creditos,
            nivel: entidad.nivel,
            prereq: entidad.prerrequisitos
        }));
    }

    async obtenerMallaDesdeBD(codigoCarrera: string)
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
    
    //Eliminar
    async obtenerAsignatura(codigoAsignatura: string,  codigoCarrera: string)
    {
        const asignaturaEncontrada = await this.asignaturaRepo.findOne({
            where: { 
                codigoAsignatura: codigoAsignatura,
                codigoCarrera: codigoCarrera
            }
        });

        if (!asignaturaEncontrada) 
        {
            throw new NotFoundException(`La asignatura con código ${codigoAsignatura} no existe en esta carrera.`);
        }

        return {
            codigo: asignaturaEncontrada.codigoAsignatura,
            asignatura: asignaturaEncontrada.nombreAsignatura,
            creditos: asignaturaEncontrada.creditos,
            nivel: asignaturaEncontrada.nivel,
            prereq: asignaturaEncontrada.prerrequisitos
        };
    }

}