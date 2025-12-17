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
import { ProyeccionConsistencyService } from './proyeccion.consistencia'; // 👈 Nuevo
import { ProyeccionStrategyFactory } from './strategies/proyeccion-strategy.factory';

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
        private readonly consistencyService: ProyeccionConsistencyService, // Inyección
        private readonly strategyFactory: ProyeccionStrategyFactory,

        @InjectRepository(Proyeccion)
        private proyeccionRepository: Repository<Proyeccion>,
        @InjectRepository(Semestre)
        private semestreRepository: Repository<Semestre>,
        @InjectRepository(InstanciaAsignatura) private instanciaRepository: Repository<InstanciaAsignatura>
        
    ) {}

    async proyeccionFutura(rutAlumno:string, codigoCarrera:string, catalogo:string, proyeccionDto: CreacionProyeccion)
    {
        const estado = await this.studentFacade.obtenerEstadoAcademico(rutAlumno, codigoCarrera, catalogo);
        const estrategia = this.strategyFactory.createStrategy('GREEDY', estado);
        const mapaFuturo = estrategia.generar();

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try 
        {

            const semestresAvance = this.mapper.avanceToPersistence(estado.avancePorPeriodo, codigoCarrera);

            const ultimoSemestreAvance = semestresAvance[semestresAvance.length - 1];

            let siguienteNumero = ultimoSemestreAvance.numero;

            const tipoSemestre = ultimoSemestreAvance.periodo.slice(4, 6);
            
            if (tipoSemestre !== '15' && tipoSemestre !== '25') 
            {
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

        const estrategia = this.strategyFactory.createStrategy('GREEDY', estado);
        const mapaFuturo = estrategia.generar();

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

    async obtenerAsignaturasProyeccionManual(idProyeccion: number, catalogo:string, semestreObjetivo?: number)
    {
        const proyeccion = await this.buscarProyeccionYFusionar(idProyeccion, catalogo, semestreObjetivo);
        const proyeccionManual = new ProyeccionManual(proyeccion.estado);
        
        return proyeccionManual.enviarAsignaturasNormales();
    }

    async obtenerAsignaturasExcepcion(
        idProyeccion: number, 
        catalogo: string, 
        tipoSolicitud: 'SIN_PREREQ' | 'EXTRA_SEMESTRE' | 'COMBINADA',
        semestreObjetivo?: number
    )
    {
        const proyeccion = await this.buscarProyeccionYFusionar(idProyeccion, catalogo, semestreObjetivo);
        const proyeccionManual = new ProyeccionManual(proyeccion.estado);

        return proyeccionManual.enviarCandidatosExcepcion(tipoSolicitud);
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
            throw new InternalServerErrorException("Error al guardar el semestre.");
        }
        finally 
        {
            await queryRunner.release();
        }

        try 
        {
            await this.validarConsistenciaProyeccion(idProyeccion, catalogo, periodo);
        } 
        catch (validationError) 
        {
            console.error("Advertencia: Error al validar consistencia, pero el semestre se guardó.", validationError);
        }

        return this.obtenerProyeccionCompleta(idProyeccion);
    }

    async validarConsistenciaProyeccion(idProyeccion: number, catalogo: string, periodoProtegido?: string)
    {
        const proyeccion = await this.proyeccionRepository.findOne({
            where: { idProyeccion },
            relations: ['semestres', 'semestres.instancias', 'semestres.instancias.asignatura']
        });

        if (!proyeccion) return;

        const estado = await this.studentFacade.obtenerEstadoAcademico(
            proyeccion.rutUsuario, proyeccion.codigoCarrera, catalogo
        );

        // Llamamos al especialista en Tetris y Reglas
        return this.consistencyService.validarYCorregir(
            proyeccion.semestres,
            estado.mallaCompleta,
            estado.asignaturasAprobadas,
            estado.ultimoPeriodo,
            periodoProtegido
        );
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

    private async buscarProyeccionYFusionar(idProyeccion: number, catalogo: string, semestreObjetivo?: number) {
        const proyeccion = await this.proyeccionRepository.findOne({
            where: { idProyeccion },
            relations: ['semestres', 'semestres.instancias', 'semestres.instancias.asignatura']
        });

        if (!proyeccion) throw new NotFoundException(`Proyección no encontrada.`);

        const estado = await this.studentFacade.obtenerEstadoAcademico(
            proyeccion.rutUsuario, 
            proyeccion.codigoCarrera, 
            catalogo
        );

        this.fusionarEstadoConProyeccion(estado, proyeccion, semestreObjetivo);
        
        return { proyeccion, estado };
    }

}