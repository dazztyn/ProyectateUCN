import { Injectable } from '@nestjs/common';
import { MallaService } from '../../mallacurricular/malla/malla.service';
import { RamoTomado } from './RamoTomado';
import { ErrorResponse } from '../../ArchivosComunes/ErrorResponse';
import { Asignatura } from '../../ArchivosComunes/Asignatura';
import { AvanceConAsignatura } from './AvanceConAsignatura';
import { AcademicUtilsService } from '../../ArchivosComunes/AcademicUtilsService';
import { AvanceReal } from './entities/avance-real.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';


@Injectable()
export class AvanceService 
{
    constructor(
        private readonly mallaService: MallaService,
        private readonly academicUtils: AcademicUtilsService,
        @InjectRepository(AvanceReal)
        private readonly avanceRealRepo: Repository<AvanceReal>
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

    ordenarPorPeriodo(arr: AvanceConAsignatura[]): AvanceConAsignatura[] 
    {
        return arr.sort((a, b) => {
            if (a.getPeriod() > b.getPeriod()) return 1;
            if (a.getPeriod() < b.getPeriod()) return -1;
            return 0;
        });
    }

    verificarAsignatura(codigoAsignatura: string, malla: Asignatura[])
    {
        return this.academicUtils.buscarAsignatura(codigoAsignatura, malla) || null;
    }

    rellenarListaDeAvance(avance: RamoTomado[], malla: Asignatura[]): AvanceConAsignatura[]
    {
        const listaDeAvance: AvanceConAsignatura[] = [];
        avance.forEach((ramo) =>
        {
            const asignatura = this.verificarAsignatura(ramo.course, malla);
            if(asignatura != null && !ramo.excluded)
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

        return this.ordenarPorPeriodo(listaDeAvance);
    }


    async sincronizarAvanceFull(rut: string, codigoCarrera: string, catalogo: string) {
        

        const rawAvance = await this.fetchAvanceData(rut, codigoCarrera);
        const malla = await this.mallaService.fetchMallaCarrera(codigoCarrera, catalogo);
        const avanceProcesado = this.rellenarListaDeAvance(rawAvance, malla);


        const avanceEnBD = await this.avanceRealRepo.find({
            where: { rutUsuario: rut, codigoCarrera: codigoCarrera }
        });

        const mapaMaestro = new Map<string, AvanceReal>();

        avanceEnBD.forEach(a => {
            const clave = `${a.codigoAsignatura}-${a.periodo}`;
            mapaMaestro.set(clave, a);
        });

        for (const item of avanceProcesado) 
        {
            
            const curso = item.getCourse();
            const codigo = curso.codigo;
            const periodo = item.getPeriod();
            const clave = `${codigo}-${periodo}`; 

            const nrc = item.getNrc();
            const estado = item.getStatus();
            const nombre = curso.asignatura;
            const creditos = curso.creditos;

            let entidad = mapaMaestro.get(clave);

            if (entidad) 
            {

                const yaEstabaAprobado = entidad.estado === 'APROBADO';
                const nuevoEsAprobado = estado === 'APROBADO';
                
                if (!yaEstabaAprobado || nuevoEsAprobado) {
                    
                    if(entidad.nrc !== nrc || 
                        entidad.creditos !== creditos)
                    {
                        entidad.estado = estado;
                        entidad.nrc = nrc;
                        entidad.creditos = creditos;
                        entidad.periodo = periodo;
                    }
                    
                }
            } 
            else
            {

                entidad = this.avanceRealRepo.create({
                    rutUsuario: rut,
                    codigoCarrera: codigoCarrera,
                    codigoAsignatura: codigo,
                    nombreAsignatura: nombre,
                    periodo: periodo,
                    estado: estado,
                    nrc: nrc,
                    creditos: creditos
                });
                
                mapaMaestro.set(clave, entidad);
            }
        }

        const listaFinalParaGuardar = Array.from(mapaMaestro.values());

        if (listaFinalParaGuardar.length > 0) 
        {
            await this.avanceRealRepo.save(listaFinalParaGuardar);
        }
    }

    async obtenerAvanceDesdeBD(rut: string, codigoCarrera: string) {
        const avancePlano = await this.avanceRealRepo.find({
            where: { rutUsuario: rut, codigoCarrera: codigoCarrera },
            order: { periodo: 'ASC' }
        });

        const listaPlana = avancePlano.map(item => ({
            nrc: item.nrc || '',
            periodo: item.periodo,
            rut: rut,
            codigo: item.codigoAsignatura,
            asignatura: item.nombreAsignatura,
            creditos: item.creditos || 0,
            estado: item.estado,
            tipo: 'REGULAR'
        }));

        const avanceAgrupado = this.academicUtils.agruparPor(listaPlana, (ramo) => ramo.periodo);

        return Object.fromEntries(avanceAgrupado);

    }
    
    avanceSeparadoPorPeriodo(avance: AvanceConAsignatura[]): Map<string, AvanceConAsignatura[]>
    {
        return this.academicUtils.agruparPor(avance, (a) => a.getPeriod());
    }

    sacarUltimoPeriodo(avancePorPeriodo: Map<string, AvanceConAsignatura[]>)
    {
        let keys = Array.from(avancePorPeriodo.keys());
        return keys[keys.length - 1];
    }
}