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
        
        // Usamos el nuevo método de ordenamiento simplificado
        return this.ordenarPorPeriodo(listaDeAvance);
    }

    // ===========================================================================
    // NUEVA LÓGICA DE SINCRONIZACIÓN (UPSERT)
    // ===========================================================================

    /**
     * Descarga, Procesa (limpia excluidos/nombres) y Guarda en BD
     */
    async sincronizarAvanceFull(rut: string, codigoCarrera: string, catalogo: string) {
        
        // 1. Obtener datos CRUDOS de la API
        const rawAvance = await this.fetchAvanceData(rut, codigoCarrera);
        
        // 2. Obtener la MALLA para sacar los nombres
        const malla = await this.mallaService.fetchMallaCarrera(codigoCarrera, catalogo);

        // 3. PROCESAR: Aquí usamos tu lógica existente.
        // Esto nos devuelve una lista limpia de 'AvanceConAsignatura'
        // que ya ignoró los 'excluded' y ya tiene el nombre del ramo.
        const avanceProcesado = this.rellenarListaDeAvance(rawAvance, malla);

        // 4. PREPARAR BASE DE DATOS (UPSERT)
        // Traemos lo que ya existe en BD para no duplicar
        const avanceEnBD = await this.avanceRealRepo.find({
            where: { rutUsuario: rut, codigoCarrera: codigoCarrera }
        });

        const mapaBD = new Map<string, AvanceReal>();
        avanceEnBD.forEach(a => {
            // Clave única: "DCCB-00107-202310"
            const claveUnica = `${a.codigoAsignatura}-${a.periodo}`; 
            mapaBD.set(claveUnica, a);
        });

        const entidadesAGuardar: AvanceReal[] = [];

        // 5. Recorrer la lista LIMPIA y convertirla a Entidades
        for (const item of avanceProcesado) {
            
            // Extraemos datos de tu objeto AvanceConAsignatura
            const curso = item.getCourse(); // Esto es tipo Asignatura
            const codigo = curso.codigo;
            const nombre = curso.asignatura; // ¡Aquí está el nombre real!
            const periodo = item.getPeriod();
            const estado = item.getStatus();
            const nrc = item.getNrc();
            const creditos = curso.creditos;

            const claveBusqueda = `${codigo}-${periodo}`;
            const entidadExistente = mapaBD.get(claveBusqueda);

            if (entidadExistente) {
                // 🟩 CASO ACTUALIZAR
                // TypeScript sabe que 'entidadExistente' NO es undefined dentro de este if
                
                if (entidadExistente.estado !== estado || 
                    entidadExistente.periodo !== periodo ||
                    entidadExistente.nrc !== nrc ||
                    entidadExistente.creditos !== creditos)
                {
                    entidadExistente.estado = estado;
                    entidadExistente.periodo = periodo;
                    entidadExistente.nrc = nrc;
                    entidadExistente.creditos = creditos;
                    
                    entidadesAGuardar.push(entidadExistente);
                }
            }
            else 
            {
                // --- CREAR ---
                const nuevo = this.avanceRealRepo.create({
                    rutUsuario: rut,
                    codigoCarrera: codigoCarrera,
                    nrc: nrc,
                    codigoAsignatura: codigo,
                    nombreAsignatura: nombre,
                    creditos: creditos,
                    periodo: periodo,
                    estado: estado,
                });
                entidadesAGuardar.push(nuevo);
            }
        }

        // 6. Guardar cambios
        if (entidadesAGuardar.length > 0) {
            await this.avanceRealRepo.save(entidadesAGuardar);
            console.log(`✅ Sincronización completa: ${entidadesAGuardar.length} registros actualizados.`);
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
        // Usamos el utilitario genérico para agrupar
        return this.academicUtils.agruparPor(avance, (a) => a.getPeriod());
    }

    sacarUltimoPeriodo(avancePorPeriodo: Map<string, AvanceConAsignatura[]>)
    {
        let keys = Array.from(avancePorPeriodo.keys());
        return keys[keys.length - 1];
    }
}