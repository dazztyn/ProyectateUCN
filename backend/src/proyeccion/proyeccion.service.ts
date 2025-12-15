import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Entidades
import { Proyeccion } from './entities/proyeccion.entity';
import { Semestre } from './entities/semestre.entity';
import { Asignaturas } from '../mallacurricular/entities/asignatura.entity';

// DTOs
import { CreacionProyeccion } from './DtoProyeccion/CreacionProyeccion';

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
        @InjectRepository(Asignaturas)
        private asignaturaRepository: Repository<Asignatura>,
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

            const catalogoEntidades = this.mapper.toPersistenceCatalog(estado.mallaCompleta);

            await queryRunner.manager.createQueryBuilder()
                .insert()
                .into(Asignaturas)
                .values(catalogoEntidades)
                .orIgnore()
                .execute();

            const semestresAvance = this.mapper.avanceToPersistence(estado.avancePorPeriodo);

            const ultimoSemestreAvance = semestresAvance[semestresAvance.length - 1];
            let siguienteNumero = ultimoSemestreAvance.numero;
            const tipoSemestre = ultimoSemestreAvance.periodo.slice(4, 6);
            if (tipoSemestre !== '15' && tipoSemestre !== '25') {
                siguienteNumero++;
            }
            
            const semestresFuturo = this.mapper.futureToPersistence(mapaFuturo, siguienteNumero);
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

    /**
     * Prepara datos para manual (Facade + Helper)
     */
    async obtenerAsignaturasProyeccionManual(rutAlumno:string, codigoCarrera:string, catalogo:string)
    {
        const estado = await this.studentFacade.obtenerEstadoAcademico(rutAlumno, codigoCarrera, catalogo);
        const proyeccionManual = new ProyeccionManual(estado);
        return proyeccionManual.enviarAsignaturas();
    }

    /**
     * Crea solo avance (Facade + Mapper + Repo)
     */
    async crearProyeccionConAvance(rut: string, catalogo: string, codigoCarrera: string, proyeccionDto: CreacionProyeccion)
    {
        const estado = await this.studentFacade.obtenerEstadoAcademico(rut, codigoCarrera, catalogo);

        // Mapper: Convertir solo avance
        const semestresDto = this.mapper.avanceToPersistence(estado.avancePorPeriodo);
        
        // Repo: Guardar catálogo y proyección
        const catalogoEntidades = this.mapper.toPersistenceCatalog(estado.mallaCompleta);
        await this.guardarCatalogoAsignaturas(catalogoEntidades);

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

    async obtenerProyeccionCompleta(idProyeccion: number)
    {
        const proyeccion = await this.proyeccionRepository.findOne({
            where: { idProyeccion: idProyeccion },
            relations: ['semestres', 'semestres.instancias', 'semestres.instancias.asignatura']
        });

        if (!proyeccion) throw new NotFoundException(`Proyección ${idProyeccion} no encontrada.`);

        return this.mapper.toResponse(proyeccion);
    } 

    private async guardarCatalogoAsignaturas(asignaturasDto: any[]) 
    {
        const entidades = this.asignaturaRepository.create(asignaturasDto);
        await this.asignaturaRepository.createQueryBuilder()
            .insert().into(Asignaturas).values(entidades)
            .orIgnore().execute();
    }

    // private async guardarProyeccionCompleta(
    //     avanceMap: Map<string, AvanceConAsignatura[]>, 
    //     futuroMap: Map<string, Asignatura[]>, 
    //     rut: string, 
    //     dto: CreacionProyeccion
    // ): Promise<number> {
        
    //     // 1. Usar Mapper para convertir el Avance
    //     const semestresAvance = this.mapper.avanceToPersistence(avanceMap);

    //     // 2. Calcular número de semestre para continuar
    //     const ultimoSemestreAvance = semestresAvance[semestresAvance.length - 1];
    //     let siguienteNumero = ultimoSemestreAvance.numero;
        
    //     // (Tu lógica original de saltar veranos para el contador)
    //     const tipoSemestre = ultimoSemestreAvance.periodo.slice(4, 6);
    //     if (tipoSemestre !== '15' && tipoSemestre !== '25') {
    //         siguienteNumero++;
    //     }

    //     // 3. Usar Mapper para convertir el Futuro
    //     const semestresFuturo = this.mapper.futureToPersistence(futuroMap, siguienteNumero);

    //     // 4. Unir y Guardar
    //     const todosLosSemestres = semestresAvance.concat(semestresFuturo);
        
    //     const entidad = this.proyeccionRepository.create({
    //         rutUsuario: rut,
    //         ideal: dto.ideal,
    //         nombreProyeccion: dto.nombreProyeccion,
    //         semestres: todosLosSemestres,
    //     });
    //     try
    //     {
    //         const guardada = await this.proyeccionRepository.save(entidad);
    //         return guardada.idProyeccion;
    //     }
    //     catch (error) 
    //     {
    //         if (error.code === '23505') 
    //         {
    //             throw new ConflictException(
    //                 `Ya existe una proyección con el nombre "${dto.nombreProyeccion}". Por favor elige otro.`
    //             );
    //         }
        
    //         console.error(error);
    //         throw new InternalServerErrorException('Error al guardar la proyección');
    //     }
    // }

    async obtenerEstadisticas(periodo: string) 
    {
        const resultado = await this.instanciaRepository
            .createQueryBuilder('instancia')
            .leftJoin('instancia.semestre', 'semestre') 
            .leftJoinAndSelect('instancia.asignatura', 'asignatura') 
            .select('asignatura.nombreAsignatura', 'nombre') 
            .addSelect('asignatura.codigoAsignatura', 'codigo') 
            .addSelect('COUNT(instancia.id)', 'total') // Cuenta cuántas veces aparece
            .where('semestre.periodo = :periodo', { periodo })
            .groupBy('asignatura.codigoAsignatura') 
            .addGroupBy('asignatura.nombreAsignatura') 
            .orderBy('total', 'DESC') // Ordena: los más solicitados primero
            .limit(20) // Top 20 asignaturas
            .getRawMany(); 

        return resultado;
    }
}