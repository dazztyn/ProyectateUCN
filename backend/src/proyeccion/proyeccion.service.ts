import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Entidades
import { Proyeccion } from './entities/proyeccion.entity';
import { Semestre } from './entities/semestre.entity';

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

    /**
     * Toma una proyección existente (manual o incompleta) y la rellena hasta el final
     * usando el algoritmo Greedy.
     */
    async autocompletarProyeccion(idProyeccion: number, catalogoCarrera: string)
    {
        // 1. Recuperar la Proyección Manual desde la BD
        // Necesitamos cargar las relaciones para ver qué puso el usuario
        const proyeccionExistente = await this.proyeccionRepository.findOne({
            where: { idProyeccion },
            relations: ['semestres', 'semestres.instancias', 'semestres.instancias.asignatura']
        });

        if (!proyeccionExistente) throw new NotFoundException("Proyección no encontrada");

        // 2. Obtener el Estado Académico REAL (Base)
        // Esto trae su historial real (Avance) y la Malla
        const estado = await this.studentFacade.obtenerEstadoAcademico(
            proyeccionExistente.rutUsuario, 
            proyeccionExistente.codigoCarrera, 
            catalogoCarrera // Ojo: Aquí deberías tener el catálogo guardado en la proyección o sacarlo de algún lado
        );

        // =====================================================================
        // 🧠 EL TRUCO: FUSIONAR REALIDAD + FICCIÓN MANUAL
        // =====================================================================
        
        // Vamos a modificar el 'estado' en memoria para engañar al algoritmo Greedy
        
        let ultimoPeriodoManual = estado.ultimoPeriodo;

        if (proyeccionExistente.semestres) {
            // Ordenamos los semestres manuales cronológicamente
            const semestresOrdenados = proyeccionExistente.semestres.sort((a, b) => a.numero - b.numero);

            for (const semestre of semestresOrdenados) {
                // Actualizamos el último periodo para que Greedy arranque DESPUÉS de esto
                // (Solo si el semestre manual es futuro respecto al avance real)
                if (semestre.periodo > ultimoPeriodoManual) {
                    ultimoPeriodoManual = semestre.periodo;
                }

                // Agregamos los ramos manuales al Set de "Aprobados"
                // Así Greedy sabe que prerequisitos ya se cumplieron y no sugiere estos ramos de nuevo.
                if (semestre.instancias) {
                    for (const instancia of semestre.instancias) {
                        estado.asignaturasAprobadas.add(instancia.asignatura.codigoAsignatura);
                    }
                }
            }
        }

        // Le decimos al estado: "Tu punto de partida ahora es el final de lo que el usuario editó"
        estado.ultimoPeriodo = ultimoPeriodoManual;

        // =====================================================================
        // 3. EJECUTAR ALGORITMO (AUTOCOMPLETADO)
        // =====================================================================
        
        // Ahora Greedy cree que el alumno ya cursó lo manual y calculará el resto
        const estrategia: IProyeccionStrategy = new GreedyProjectionStrategy(estado);
        const mapaFuturo = estrategia.generar(estado); // Genera solo lo que falta

        // =====================================================================
        // 4. GUARDAR LOS NUEVOS SEMESTRES
        // =====================================================================

        // Calculamos el número de semestre para continuar la numeración
        const ultimoSemestreDb = proyeccionExistente.semestres.sort((a,b) => b.numero - a.numero)[0];
        let siguienteNumero = ultimoSemestreDb ? ultimoSemestreDb.numero : 1;
        
        // Ajuste de lógica de saltar semestre si corresponde (tu lógica de veranos)
        const tipoSemestre = ultimoPeriodoManual.slice(4, 6);
        if (tipoSemestre !== '15' && tipoSemestre !== '25') {
            siguienteNumero++;
        }

        // Convertimos el mapa del algoritmo a Entidades (usando tu Mapper)
        // OJO: Aquí pasamos el codigoCarrera que recuperamos de la proyección misma
        const nuevosSemestres = this.mapper.futureToPersistence(
            mapaFuturo, 
            siguienteNumero, 
            proyeccionExistente.codigoCarrera
        );

        // Guardamos los nuevos semestres y los vinculamos a la proyección existente
        // No borramos lo anterior, solo ANEXAMOS lo nuevo.
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            for (const semDto of nuevosSemestres) {

                const nuevoSemestreEntidad = queryRunner.manager.create(Semestre, semDto);

                nuevoSemestreEntidad.proyeccion = proyeccionExistente; 
                
                await queryRunner.manager.save(Semestre, nuevoSemestreEntidad);
            }

            await queryRunner.commitTransaction();
            
            return this.obtenerProyeccionCompleta(idProyeccion);

        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error(error);
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