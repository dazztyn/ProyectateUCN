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
        
        // 1. Obtener datos API y Malla
        const rawAvance = await this.fetchAvanceData(rut, codigoCarrera);
        const malla = await this.mallaService.fetchMallaCarrera(codigoCarrera, catalogo);
        const avanceProcesado = this.rellenarListaDeAvance(rawAvance, malla);

        // 2. Obtener datos de BD
        const avanceEnBD = await this.avanceRealRepo.find({
            where: { rutUsuario: rut, codigoCarrera: codigoCarrera }
        });

        // 3. Crear el "Mapa Maestro" 🗺️
        // Este mapa contendrá la versión FINAL de cada ramo.
        // Clave: "CODIGO-PERIODO" -> Valor: Entidad AvanceReal
        const mapaMaestro = new Map<string, AvanceReal>();

        // Llenamos el mapa con lo que ya existe en BD
        avanceEnBD.forEach(a => {
            const clave = `${a.codigoAsignatura}-${a.periodo}`;
            mapaMaestro.set(clave, a);
        });

        // 4. Procesar la lista de la API
        for (const item of avanceProcesado) {
            
            const curso = item.getCourse();
            const codigo = curso.codigo;
            const periodo = item.getPeriod();
            const clave = `${codigo}-${periodo}`; // 🔑 La clave única

            const nrc = item.getNrc();
            const estado = item.getStatus();
            const nombre = curso.asignatura;
            const creditos = curso.creditos;

            // 👇 LA MAGIA: Buscamos en el Mapa Maestro (que se actualiza en tiempo real)
            // Si ya procesamos un duplicado en este mismo bucle, lo encontraremos aquí.
            let entidad = mapaMaestro.get(clave);

            if (entidad) {
                // === CASO: YA EXISTE (En BD o duplicado anterior en la lista API) ===
                // Actualizamos los datos siempre (El último dato de la API manda)
                
                // Opcional: Lógica para preferir 'APROBADO' sobre 'REPROBADO' si es el mismo periodo
                // Si la entidad que ya tenemos está APROBADA y la nueva es REPROBADA, quizás no queremos sobrescribir.
                // Pero por ahora, dejemos que el último gane para simplificar.

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
                    
                    // No necesitamos hacer push a un array todavía, el objeto está en el mapa
                }
            } 
            else {
                // === CASO: TOTALMENTE NUEVO ===
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
                
                // ¡IMPORTANTE! Lo agregamos al mapa inmediatamente.
                // Así, si viene un duplicado en la siguiente iteración, caerá en el 'if' de arriba
                // y no creará otro objeto nuevo.
                mapaMaestro.set(clave, entidad);
            }
        }

        // 5. Guardar el Mapa Maestro
        // Convertimos los valores del mapa a un array y guardamos TODO.
        // TypeORM es inteligente: si tiene ID hace update, si no, hace insert.
        const listaFinalParaGuardar = Array.from(mapaMaestro.values());

        if (listaFinalParaGuardar.length > 0) {
            await this.avanceRealRepo.save(listaFinalParaGuardar);
            console.log(`Sincronización completa: ${listaFinalParaGuardar.length} registros procesados.`);
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