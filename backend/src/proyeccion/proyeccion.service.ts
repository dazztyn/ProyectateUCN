import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

// Entidades
import { Asignaturas } from '../mallacurricular/entities/asignatura.entity';
import { Proyeccion } from './entities/proyeccion.entity';
import { Semestre } from './entities/semestre.entity';

// DTOs
import { CreacionProyeccion } from './DtoProyeccion/CreacionProyeccion';
import { AsignaturaInputDto } from './DtoProyeccion/GuardarSemestreDto';

// Patrones
import { StudentDataFacade } from './StudentDataFacade';
import { ProyeccionMapper } from './proyeccion.mapper';
import { IProyeccionStrategy } from './strategies/IProyeccionStrategy';
import { GreedyProjectionStrategy } from './strategies/GreedyProjectionStrategy';
import { ProyeccionManual } from './ProyeccionManual';

// Tipos
import { Asignatura } from '../ArchivosComunes/Asignatura';

// para stats
import { InstanciaAsignatura } from './entities/InstanciaAsignatura.entity.js';

//para transacciones
import { DataSource } from 'typeorm';
import { EstadoAcademico } from './interfaces/EstadoAcademico';

@Injectable()
export class ProyeccionService 
{
    constructor(
        private readonly studentFacade: StudentDataFacade,
        private readonly mapper: ProyeccionMapper,
        private readonly dataSource: DataSource,

        @InjectRepository(Proyeccion)
        private proyeccionRepository: Repository<Proyeccion>,
        @InjectRepository(Semestre)
        private semestreRepository: Repository<Semestre>,
        @InjectRepository(InstanciaAsignatura) private instanciaRepository: Repository<InstanciaAsignatura>
        
    ) {}

    async proyeccionFutura(rutAlumno:string, codigoCarrera:string, catalogo:string, proyeccionDto: CreacionProyeccion)
    {
        const estado = await this.studentFacade.obtenerEstadoAcademico(rutAlumno, codigoCarrera, catalogo);
        const estrategia: IProyeccionStrategy = new GreedyProjectionStrategy(estado);
        const mapaFuturo = estrategia.generar(estado);

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try 
        {

            const semestresAvance = this.mapper.avanceToPersistence(estado.avancePorPeriodo, codigoCarrera);

            const ultimoSemestreAvance = semestresAvance[semestresAvance.length - 1];
            let siguienteNumero = ultimoSemestreAvance.numero;
            const tipoSemestre = ultimoSemestreAvance.periodo.slice(4, 6);
            if (tipoSemestre !== '15' && tipoSemestre !== '25') {
                siguienteNumero++;
            }
            
            const semestresFuturo = this.mapper.futureToPersistence(mapaFuturo, siguienteNumero, codigoCarrera);
            const todosLosSemestres = semestresAvance.concat(semestresFuturo);

            const nuevaProyeccion = queryRunner.manager.create(Proyeccion, {
                rutUsuario: rutAlumno,
                codigoCarrera: codigoCarrera,
                ideal: proyeccionDto.ideal,
                nombreProyeccion: proyeccionDto.nombreProyeccion,
                semestres: todosLosSemestres,
            });

            const guardada = await queryRunner.manager.save(nuevaProyeccion);
            
            await queryRunner.commitTransaction();
            
            return this.obtenerProyeccionCompleta(guardada.idProyeccion);

        } 
        catch (error)
        {
            await queryRunner.rollbackTransaction();
            
            if (error.code === '23505') 
            {
                throw new ConflictException(`Ya existe una proyección con ese nombre.`);
            }
            throw new InternalServerErrorException('Error al guardar la proyección, se han revertido los cambios.');
        } 
        finally 
        {
            await queryRunner.release();
        }
    }

    async listarProyeccionesDeUsuario(rut: string, codigoCarrera: string) 
    {
        const proyecciones = await this.proyeccionRepository.find({
            where: { 
                rutUsuario: rut,
                codigoCarrera: codigoCarrera 
            },
            select: {
                idProyeccion: true,
                nombreProyeccion: true,
                ideal: true,
                rutUsuario: true
            },
            order: { idProyeccion: 'DESC' }
        });
        return this.mapper.toSummaryResponseList(proyecciones);
    }

    private fusionarEstadoConProyeccion(estado: EstadoAcademico, proyeccion: Proyeccion, hastaSemestreNumero?: number): void 
    {
        if (!proyeccion.semestres || proyeccion.semestres.length === 0) return;

        let ultimoPeriodoSimulado = estado.ultimoPeriodo;

        const semestresOrdenados = proyeccion.semestres.sort((a, b) => a.numero - b.numero);

        for (const semestre of semestresOrdenados) 
        {
            if (hastaSemestreNumero !== undefined && semestre.numero >= hastaSemestreNumero) 
            {
                break; 
            }

            if (semestre.periodo > ultimoPeriodoSimulado) {
                ultimoPeriodoSimulado = semestre.periodo;
            }

            if (semestre.instancias) {
                for (const instancia of semestre.instancias) {
                    estado.asignaturasAprobadas.add(instancia.asignatura.codigoAsignatura);
                }
            }
        }

        estado.ultimoPeriodo = ultimoPeriodoSimulado;
    }

    async validarConsistenciaProyeccion(idProyeccion: number, catalogo: string)
    {
        const proyeccion = await this.proyeccionRepository.findOne({
            where: { idProyeccion },
            relations: ['semestres', 'semestres.instancias', 'semestres.instancias.asignatura']
        });

        if (!proyeccion) return;

        const estado = await this.studentFacade.obtenerEstadoAcademico(
            proyeccion.rutUsuario, 
            proyeccion.codigoCarrera, 
            catalogo
        );

        // Conjunto de asignaturas aprobadas (Históricas + Proyectadas que vamos acumulando)
        const aprobadosAcumulados = new Set(estado.asignaturasAprobadas);

        // Preparamos la malla ordenada por nivel para calcular rápidamente el "tapón" académico
        const mallaOrdenada = estado.mallaCompleta.sort((a, b) => a.nivel - b.nivel);

        // Ordenamos cronológicamente los semestres de la proyección
        const semestresOrdenados = proyeccion.semestres.sort((a, b) => a.numero - b.numero);

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            let huboCambios = false;

            for (const semestre of semestresOrdenados) 
            {
                // PASO 1: Calcular el "Nivel más atrasado" actual
                // Buscamos el primer ramo de la malla que NO esté en aprobadosAcumulados
                let nivelMasAtrasado = 1; // Por defecto
                for (const asignaturaMalla of mallaOrdenada) {
                    if (!aprobadosAcumulados.has(asignaturaMalla.codigo)) {
                        nivelMasAtrasado = asignaturaMalla.nivel;
                        break; // Encontramos el tapón, dejamos de buscar
                    }
                }

                // La regla: Solo puede tomar ramos hasta (NivelMasAtrasado + 2)
                const nivelMaximoPermitido = nivelMasAtrasado + 2;
                
                // console.log(`Semestre ${semestre.numero}: Tapón en nivel ${nivelMasAtrasado}. Máximo permitido: ${nivelMaximoPermitido}`);

                const instanciasValidas: InstanciaAsignatura[] = [];

                if (semestre.instancias) 
                {
                    for (const instancia of semestre.instancias) 
                    {
                        const asignatura = instancia.asignatura;

                        // Protección contra nulos
                        if (!asignatura) {
                            await queryRunner.manager.remove(instancia);
                            huboCambios = true;
                            continue;
                        }

                        let esValido = true;
                        let motivoEliminacion = "";

                        // --- VALIDACIÓN A: Regla de los 2 Semestres ---
                        if (asignatura.nivel > nivelMaximoPermitido) {
                            esValido = false;
                            motivoEliminacion = `Nivel ${asignatura.nivel} excede el límite permitido (${nivelMaximoPermitido})`;
                        }

                        // --- VALIDACIÓN B: Prerrequisitos (Solo si pasó la A) ---
                        if (esValido && asignatura.prerrequisitos && asignatura.prerrequisitos.length > 0) 
                        {
                            const requisitos = asignatura.prerrequisitos.split(',').map(r => r.trim());
                            const tieneTodos = requisitos.every(req => aprobadosAcumulados.has(req));
                            
                            if (!tieneTodos) {
                                esValido = false;
                                motivoEliminacion = "Falta de prerrequisitos";
                            }
                        }

                        if (esValido) 
                        {
                            // Aprobamos virtualmente para los siguientes semestres
                            aprobadosAcumulados.add(asignatura.codigoAsignatura);
                            instanciasValidas.push(instancia);
                        } 
                        else
                        {
                            // Borramos la asignatura
                            await queryRunner.manager.remove(instancia);
                            console.log(`Eliminando ${asignatura.codigoAsignatura} del semestre ${semestre.numero}. Razón: ${motivoEliminacion}`);
                            huboCambios = true;
                        }
                    }
                }

                // Actualizamos la lista en memoria
                semestre.instancias = instanciasValidas; 

                // ACTUALIZACIÓN DE CRÉDITOS
                const nuevosCreditos = instanciasValidas.reduce((acc, inst) => {
                    return acc + (inst.asignatura?.creditos || 0);
                }, 0);

                if (semestre.totalCreditos !== nuevosCreditos) {
                    semestre.totalCreditos = nuevosCreditos;
                    await queryRunner.manager.save(semestre);
                    huboCambios = true;
                }
            }

            // ====================================
            // 🧩 FASE 2: DEFRAGMENTACIÓN (Tetris)
            // ====================================
            
            const semestresFijos = semestresOrdenados.filter(s => !s.editable);
            const semestresEditables = semestresOrdenados.filter(s => s.editable);

            const editablesVivos = semestresEditables.filter(s => s.instancias.length > 0);
            const editablesMuertos = semestresEditables.filter(s => s.instancias.length === 0);

            if (editablesMuertos.length > 0) 
            {
                console.log(`🧹 Eliminando ${editablesMuertos.length} semestres vacíos.`);
                await queryRunner.manager.remove(editablesMuertos);
                huboCambios = true;
            }

            let periodoPivote: string;
            let numeroPivote: number;

            if (semestresFijos.length > 0) 
            {
                const ultimoFijo = semestresFijos[semestresFijos.length - 1];
                periodoPivote = ultimoFijo.periodo;
                numeroPivote = ultimoFijo.numero;
            } 
            else 
            {

                periodoPivote = estado.ultimoPeriodo; 
                
                numeroPivote = 0; 
            }

            let periodoRastreo = periodoPivote;
            let numeroRastreo = numeroPivote;

            for (const semestre of editablesVivos) 
            {

                const siguientePeriodo = this.siguientePeriodo(periodoRastreo);
                const siguienteNumero = numeroRastreo + 1;

                periodoRastreo = siguientePeriodo;
                numeroRastreo = siguienteNumero;

                if (semestre.periodo !== siguientePeriodo || semestre.numero !== siguienteNumero) {
                
                    console.log(`Reorganizando: Semestre ID ${semestre.idSemestre} pasa de N°${semestre.numero} a N°${siguienteNumero} (${siguientePeriodo})`);
                    
                    semestre.periodo = siguientePeriodo;
                    semestre.numero = siguienteNumero;
                    
                    await queryRunner.manager.save(semestre);
                    huboCambios = true;
                }
            }

            await queryRunner.commitTransaction();
            return huboCambios;

        } 
        catch (error) 
        {
            console.error("Error en validación de consistencia:", error);
            await queryRunner.rollbackTransaction();
            return false; 
        } 
        finally 
        {
            await queryRunner.release();
        }
    }

    async guardarSemestreManual(
        idProyeccion: number, 
        numeroSemestre: number, 
        periodo: string, 
        asignaturasDto: AsignaturaInputDto[],
        catalogo: string
    ) 
    {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try 
        {
            const proyeccion = await this.proyeccionRepository.findOne({ where: { idProyeccion } });

            if (!proyeccion) throw new NotFoundException(`Proyección no encontrada.`);

            if (asignaturasDto.length > 0) {
                const codigosEntrantes = asignaturasDto.map(d => d.codigo);

                const asignaturasReales = await this.instanciaRepository.manager.getRepository(Asignaturas).find({
                    where: {
                        codigoAsignatura: In(codigosEntrantes),
                        codigoCarrera: proyeccion.codigoCarrera
                    }
                });

                const codigosRealesSet = new Set(asignaturasReales.map(a => a.codigoAsignatura));
                const invalidos = codigosEntrantes.filter(cod => !codigosRealesSet.has(cod));

                if (invalidos.length > 0) {
                    throw new BadRequestException(`Las siguientes asignaturas no existen en la malla: ${invalidos.join(', ')}`);
                }
            }

            let semestre = await this.semestreRepository.findOne({
                where: { numero: numeroSemestre, proyeccion: { idProyeccion: idProyeccion } },
                relations: ['instancias']
            });

            const totalCreditos = asignaturasDto.reduce((acc, curr) => acc + curr.creditos, 0);

            if (semestre) 
            {
                semestre.periodo = periodo;
                semestre.totalCreditos = totalCreditos;
                if (semestre.instancias?.length > 0) 
                {
                    await queryRunner.manager.remove(semestre.instancias);
                }
                semestre = await queryRunner.manager.save(semestre);
            } 
            else 
            {
                semestre = this.semestreRepository.create({
                    numero: numeroSemestre,
                    periodo: periodo,
                    totalCreditos: totalCreditos,
                    editable: true,
                    proyeccion: proyeccion
                });
                semestre = await queryRunner.manager.save(semestre);
            }

            const nuevasInstancias: InstanciaAsignatura[] = [];
            for (const dto of asignaturasDto) 
            {
                const nuevaInstancia = this.instanciaRepository.create({
                    estado: 'PENDIENTE', 
                    semestre: semestre,
                    asignatura: { codigoAsignatura: dto.codigo, codigoCarrera: proyeccion.codigoCarrera }
                });
                nuevasInstancias.push(nuevaInstancia);
            }

            if (nuevasInstancias.length > 0) 
            {
                await queryRunner.manager.save(nuevasInstancias);
            }

            await queryRunner.commitTransaction();

        } 
        catch (error) 
        {
            await queryRunner.rollbackTransaction();
            console.error("Error guardando semestre manual:", error);
            throw new InternalServerErrorException("Error al guardar el semestre.");
        }
        finally 
        {
            await queryRunner.release();
        }

        try 
        {
            console.log("Validando consistencia post-guardado...");
            await this.validarConsistenciaProyeccion(idProyeccion, catalogo);
        } 
        catch (validationError) 
        {
            console.error("Advertencia: Error al validar consistencia, pero el semestre se guardó.", validationError);
        }

        return this.obtenerProyeccionCompleta(idProyeccion);
    }

    async obtenerAsignaturasProyeccionManual(idProyeccion: number, catalogo:string, semestreObjetivo?: number)
    {
        const proyeccion = await this.proyeccionRepository.findOne({
            where: { idProyeccion },
            relations: ['semestres', 'semestres.instancias', 'semestres.instancias.asignatura']
        });

        if (!proyeccion) throw new NotFoundException(`La proyección ${idProyeccion} no existe.`);

        const estado = await this.studentFacade.obtenerEstadoAcademico(
            proyeccion.rutUsuario, 
            proyeccion.codigoCarrera, 
            catalogo
        );

        this.fusionarEstadoConProyeccion(estado, proyeccion, semestreObjetivo);

        const proyeccionManual = new ProyeccionManual(estado);
        return proyeccionManual.enviarAsignaturas();
    }

    async crearProyeccionConAvance(rut: string, catalogo: string, codigoCarrera: string, proyeccionDto: CreacionProyeccion)
    {
        const estado = await this.studentFacade.obtenerEstadoAcademico(rut, codigoCarrera, catalogo);

        const semestresDto = this.mapper.avanceToPersistence(estado.avancePorPeriodo, codigoCarrera);

        const nuevaProyeccion = this.proyeccionRepository.create({
            rutUsuario: rut,
            codigoCarrera: codigoCarrera,
            ideal: proyeccionDto.ideal,
            nombreProyeccion: proyeccionDto.nombreProyeccion,
            semestres: semestresDto,
        });
        try
        {
            const guardada = await this.proyeccionRepository.save(nuevaProyeccion);
            return await this.obtenerProyeccionCompleta(guardada.idProyeccion);
        }
        catch (error) 
        {
            if (error.code === '23505') {
                throw new ConflictException(`Ya tienes una proyección llamada "${proyeccionDto.nombreProyeccion}". Por favor elige otro nombre.`);
            }
            throw error;
        }
    }

    async autocompletarProyeccion(idProyeccion: number, catalogoCarrera: string)
    {

        const proyeccionExistente = await this.proyeccionRepository.findOne({
            where: { idProyeccion },
            relations: ['semestres', 'semestres.instancias', 'semestres.instancias.asignatura']
        });

        if (!proyeccionExistente) throw new NotFoundException("Proyección no encontrada");

        const estado = await this.studentFacade.obtenerEstadoAcademico(
            proyeccionExistente.rutUsuario, 
            proyeccionExistente.codigoCarrera, 
            catalogoCarrera 
        );

        this.fusionarEstadoConProyeccion(estado, proyeccionExistente);

        const estrategia: IProyeccionStrategy = new GreedyProjectionStrategy(estado);
        const mapaFuturo = estrategia.generar(estado);

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {

            const ultimoSemestreDb = proyeccionExistente.semestres.sort((a,b) => b.numero - a.numero)[0];
            let siguienteNumero = ultimoSemestreDb ? ultimoSemestreDb.numero : 0;

            const nuevosSemestresDto = this.mapper.futureToPersistence(
                mapaFuturo, 
                siguienteNumero + 1,
                proyeccionExistente.codigoCarrera 
            );

            for (const semDto of nuevosSemestresDto) 
            {
                const nuevoSemestreEntidad = queryRunner.manager.create(Semestre, semDto);

                nuevoSemestreEntidad.proyeccion = proyeccionExistente; 
                
                await queryRunner.manager.save(Semestre, nuevoSemestreEntidad);
            }

            await queryRunner.commitTransaction();
            
            return this.obtenerProyeccionCompleta(idProyeccion);

        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error("Error en autocompletar:", error);
            throw new InternalServerErrorException("Error al autocompletar la proyección");
        } finally {
            await queryRunner.release();
        }
    }

    async obtenerProyeccionCompleta(idProyeccion: number)
    {
        const proyeccion = await this.proyeccionRepository.findOne({
            where: { idProyeccion: idProyeccion },
            relations: ['semestres', 'semestres.instancias', 'semestres.instancias.asignatura']
        });

        if (!proyeccion) throw new NotFoundException(`Proyección ${idProyeccion} no encontrada.`);

        return this.mapper.toResponse(proyeccion);
    }

    async obtenerEstadisticas(periodo: string) 
    {
        const resultado = await this.instanciaRepository
            .createQueryBuilder('instancia')
            .leftJoin('instancia.semestre', 'semestre') 
            .leftJoinAndSelect('instancia.asignatura', 'asignatura') 
            .select('asignatura.nombreAsignatura', 'nombre') 
            .addSelect('asignatura.codigoAsignatura', 'codigo') 
            .addSelect('COUNT(instancia.id)', 'total')
            .where('semestre.periodo = :periodo', { periodo })
            .groupBy('asignatura.codigoAsignatura') 
            .addGroupBy('asignatura.nombreAsignatura') 
            .orderBy('total', 'DESC')
            .limit(20)
            .getRawMany(); 

        return resultado;
    }

    private siguientePeriodo(periodoActual: string): string 
    {
        const anho = parseInt(periodoActual.slice(0, 4));
        const sem = parseInt(periodoActual.slice(4, 6));

        if (sem === 10) return `${anho}20`;
        if (sem === 20) return `${anho + 1}10`;
        
        return `${anho + 1}10`; 
    }

}