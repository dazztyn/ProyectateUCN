import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Entidades
import { Proyeccion } from './entities/proyeccion.entity';
import { Semestre } from './entities/semestre.entity';
import { Asignaturas } from './entities/asignatura.entity';

// DTOs
import { CreacionProyeccion } from './DtoProyeccion/CreacionProyeccion';
import { CreacionSemestre } from './DtoProyeccion/CreacionSemestre';

// Patrones
import { StudentDataFacade } from './StudentDataFacade';
import { ProyeccionMapper } from './proyeccion.mapper';
import { IProyeccionStrategy } from './strategies/IProyeccionStrategy';
import { GreedyProjectionStrategy } from './strategies/GreedyProjectionStrategy';
import { ProyeccionManual } from './ProyeccionManual';

// Tipos
import { Asignatura } from '../ArchivosComunes/Asignatura';
import { AvanceConAsignatura } from '../avance/avance/AvanceConAsignatura';

@Injectable()
export class ProyeccionService 
{
    constructor(
        private readonly studentFacade: StudentDataFacade,
        private readonly mapper: ProyeccionMapper, // 👈 Inyección del Mapper

        @InjectRepository(Proyeccion)
        private proyeccionRepository: Repository<Proyeccion>,
        @InjectRepository(Semestre)
        private semestreRepository: Repository<Semestre>,
        @InjectRepository(Asignaturas)
        private asignaturaRepository: Repository<Asignatura>
    ) {}

    /**
     * Genera y guarda una proyección futura automática.
     */
    async proyeccionFutura(rutAlumno:string, codigoCarrera:string, catalogo:string, proyeccionDto: CreacionProyeccion)
    {
        // 1. Facade: Obtener datos
        const estado = await this.studentFacade.obtenerEstadoAcademico(rutAlumno, codigoCarrera, catalogo);

        // 2. Strategy: Calcular futuro
        const estrategia: IProyeccionStrategy = new GreedyProjectionStrategy(estado);
        const mapaFuturo = estrategia.generar(estado);

        // 3. Mapper + Repo: Persistencia del Catálogo
        const catalogoEntidades = this.mapper.toPersistenceCatalog(estado.mallaCompleta);
        await this.guardarCatalogoAsignaturas(catalogoEntidades);

        // 4. Mapper + Repo: Persistencia de la Proyección
        const idProyeccion = await this.guardarProyeccionCompleta(
            estado.avancePorPeriodo, 
            mapaFuturo, 
            rutAlumno, 
            proyeccionDto
        );

        // 5. Query: Retornar resultado
        return this.proyeccionSeparadaEnPeriodos(idProyeccion);
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
            ideal: proyeccionDto.ideal,
            nombreProyeccion: proyeccionDto.nombreProyeccion,
            semestres: semestresDto,
        });

        return await this.proyeccionRepository.save(nuevaProyeccion);
    }

    async proyeccionSeparadaEnPeriodos(idProyeccion: number)
    {
        const proyeccion = await this.proyeccionRepository.findOne({
            where: { idProyeccion: idProyeccion },
            relations: ['semestres', 'semestres.instancias', 'semestres.instancias.asignatura']
        });

        if (!proyeccion) throw new NotFoundException(`Proyección ${idProyeccion} no encontrada.`);

        const proyeccionMap = new Map<string, Asignaturas[]>();
        for (const semestre of proyeccion.semestres) {
            const asignaturas = semestre.instancias.map(i => i.asignatura);
            proyeccionMap.set(semestre.periodo, asignaturas);
        }
        return Object.fromEntries(proyeccionMap);
    } 

    // ===========================================================================
    // MÉTODOS PRIVADOS DE PERSISTENCIA (Coordinación de TypeORM)
    // ===========================================================================

    private async guardarCatalogoAsignaturas(asignaturasDto: any[]) {
        const entidades = this.asignaturaRepository.create(asignaturasDto);
        await this.asignaturaRepository.createQueryBuilder()
            .insert().into(Asignaturas).values(entidades)
            .orIgnore().execute();
    }

    private async guardarProyeccionCompleta(
        avanceMap: Map<string, AvanceConAsignatura[]>, 
        futuroMap: Map<string, Asignatura[]>, 
        rut: string, 
        dto: CreacionProyeccion
    ): Promise<number> {
        
        // 1. Usar Mapper para convertir el Avance
        const semestresAvance = this.mapper.avanceToPersistence(avanceMap);

        // 2. Calcular número de semestre para continuar
        const ultimoSemestreAvance = semestresAvance[semestresAvance.length - 1];
        let siguienteNumero = ultimoSemestreAvance.numero;
        
        // (Tu lógica original de saltar veranos para el contador)
        const tipoSemestre = ultimoSemestreAvance.periodo.slice(4, 6);
        if (tipoSemestre !== '15' && tipoSemestre !== '25') {
            siguienteNumero++;
        }

        // 3. Usar Mapper para convertir el Futuro
        const semestresFuturo = this.mapper.futureToPersistence(futuroMap, siguienteNumero);

        // 4. Unir y Guardar
        const todosLosSemestres = semestresAvance.concat(semestresFuturo);
        
        const entidad = this.proyeccionRepository.create({
            rutUsuario: rut,
            ideal: dto.ideal,
            nombreProyeccion: dto.nombreProyeccion,
            semestres: todosLosSemestres,
        });

        const guardada = await this.proyeccionRepository.save(entidad);
        return guardada.idProyeccion;
    }
}