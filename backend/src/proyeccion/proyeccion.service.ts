import { Injectable, NotFoundException } from '@nestjs/common';
import { AvanceService } from '../avance/avance/avance.service.js';
import { MallaService } from '../mallacurricular/malla/malla.service.js';
import { ProyeccionFutura } from './ProyeccionFutura.js';
import { AvanceConAsignatura } from '../avance/avance/AvanceConAsignatura.js';
import { Asignatura } from '../ArchivosComunes/Asignatura.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Proyeccion } from './entities/proyeccion.entity.js';
import { Semestre } from './entities/semestre.entity.js';
import { Asignaturas } from './entities/asignatura.entity.js';
import { Repository } from 'typeorm';
import { CreacionSemestre } from './DtoProyeccion/CreacionSemestre.js';
import { CreacionProyeccion } from './DtoProyeccion/CreacionProyeccion.js';
import { CreacionInstanciaAsignatura } from './DtoProyeccion/CreacionInstanciaAsignatura.js';
import { CreacionAsignatura } from './DtoProyeccion/CreacionAsignatura.js'
import { ProyeccionManual } from './ProyeccionManual.js';
import { InstanciaAsignatura } from './entities/InstanciaAsignatura.entity.js';


@Injectable()
export class ProyeccionService 
{
    constructor(private readonly avanceService: AvanceService, 

                private readonly mallaService: MallaService,

                @InjectRepository(Proyeccion)
                private proyeccionRepository: Repository<Proyeccion>,
                
                @InjectRepository(Semestre)
                private semestreRepository: Repository<Semestre>,
                
                @InjectRepository(Asignaturas)
                private asignaturaRepository: Repository<Asignatura>,

                @InjectRepository(InstanciaAsignatura) private instanciaRepository: Repository<InstanciaAsignatura>
                ){}

    asignaturasAprobadas(avance: AvanceConAsignatura[]): string[]
    {
        return avance
        .filter(item => item != null && item.getCourse() != null && (item.getStatus() === 'APROBADO' || item.getStatus() === 'INSCRITO'))
            .map(item => item.getCourse().codigo);
    }

    async cargarAsignaturasBaseDeDatos(malla: Asignatura[])
    {
        const mallaRefactorizada: CreacionAsignatura[] = malla.map(asig =>
        ({
            codigoAsignatura: asig.codigo,
            nombreAsignatura: asig.asignatura,
            creditos: asig.creditos,
            nivel: asig.nivel,
            prerrequisitos: asig.prereq
        }));

        const asignaturasEntidades = this.asignaturaRepository.create(mallaRefactorizada);

        await this.asignaturaRepository
        .createQueryBuilder()
        .insert()
        .into(Asignaturas)
        .values(asignaturasEntidades)
        .orIgnore()
        .execute();
    }

    crearProyeccion(rut: string, proyeccion: CreacionProyeccion, arraySemestres: CreacionSemestre[])
    {
        const nuevaProyeccion = this.proyeccionRepository.create( 
        {
            rutUsuario: rut,
            ideal: proyeccion.ideal,
            nombreProyeccion: proyeccion.nombreProyeccion,
            semestres: arraySemestres,
        })
        return nuevaProyeccion;
    }

    async agregarProyeccionFuturaEnBaseDeDatos(avanceSeparado: Map<string, AvanceConAsignatura[]>, 
        proyeccionOptima: Map<string, Asignatura[]>, rutAlumno: string, proyeccion: CreacionProyeccion): Promise<number>
    {
        const arraySemestresAvance: CreacionSemestre[] = this.crearArrayDeSemestresAvance(avanceSeparado);

        const ultimoPeriodo: string =  arraySemestresAvance[arraySemestresAvance.length - 1].periodo 

        let ultimoSemestre: number = arraySemestresAvance[arraySemestresAvance.length - 1].numero;

        const tipoSemestre = ultimoPeriodo.slice(4, 6);

        if (tipoSemestre !== '15' && tipoSemestre !== '25') 
        {
            ultimoSemestre++;
        }

        const arraySemestresProyeccionFutura: CreacionSemestre[] = this.crearArrayDeSemestresProyeccionFutura(proyeccionOptima, ultimoSemestre); 

        const arraySemestres: CreacionSemestre[] = arraySemestresAvance.concat(arraySemestresProyeccionFutura); 
        
        const nuevaProyeccion = this.crearProyeccion(rutAlumno, proyeccion, arraySemestres);

        await this.proyeccionRepository.save(nuevaProyeccion);

        return (await this.proyeccionRepository.save(nuevaProyeccion)).idProyeccion;
    }

    async proyeccionSeparadaEnPeriodos(idProyeccion: number)
    {
        const proyeccion = await this.proyeccionRepository.findOne({
            where: { idProyeccion: idProyeccion },
            relations: [
                'semestres',
                'semestres.instancias',
                'semestres.instancias.asignatura'
            ]
        });

        if (!proyeccion) {
            throw new NotFoundException(`Proyección con ID ${idProyeccion} no encontrada.`);
        }

        const proyeccionMap = new Map<string, Asignaturas[]>();

        for (const semestre of proyeccion.semestres) 
        {
            const clave = semestre.periodo;
            
            const asignaturasDelSemestre = semestre.instancias.map(
                (instancia) => instancia.asignatura
            );
            
            proyeccionMap.set(clave, asignaturasDelSemestre);
        }

        return Object.fromEntries(proyeccionMap);
        
    }    

    async proyeccionFutura(rutAlumno:string, codigoCarrera:string, catalogo:string, proyeccion: CreacionProyeccion)
    {
        const avance =  await this.avanceService.fetchAvanceData(rutAlumno,codigoCarrera);
        const malla = await this.mallaService.fetchMallaCarrera(codigoCarrera,catalogo);

        const listaDeAvanceConAsignatura = this.avanceService.rellenarListaDeAvance(avance, malla);

        let asignaturasAprobadas = this.asignaturasAprobadas(listaDeAvanceConAsignatura);

        let aparicionesPrerrequisitos = this.mallaService.asignaturasCantidadAparicionesPrerrequisitos(malla);

        let avanceSeparado = this.avanceService.avanceSeparadoPorPeriodo(listaDeAvanceConAsignatura);
        
        let mallaSeparada = this.mallaService.mallaSeparadaEnSemestres(malla);

        const ultimoPeriodo = this.avanceService.sacarUltimoPeriodo(avanceSeparado);

        const proyeccionFutura = new ProyeccionFutura(mallaSeparada, aparicionesPrerrequisitos, asignaturasAprobadas, ultimoPeriodo);

        let proyeccionOptima: Map<string, Asignatura[]> = proyeccionFutura.generarProyeccionOptima();

        this.cargarAsignaturasBaseDeDatos(malla);

        const idProyeccion = await this.agregarProyeccionFuturaEnBaseDeDatos(avanceSeparado, proyeccionOptima, rutAlumno, proyeccion);

        let proyeccionCompleta = this.proyeccionSeparadaEnPeriodos(idProyeccion);

        return proyeccionCompleta;
    }

    //POSIBLEMENTE SE BORRE ESTA COSA
    // cantidadCreditosSemestre(asignaturas: Asignatura[]): number
    // {
    //     if(asignaturas != null)
    //     {
    //         return asignaturas.reduce((totalCreditos, credito) => {return totalCreditos + credito.creditos}, 0);
    //     }
    //     return 0;
    // }

    crearArrayDeSemestresProyeccionFutura(proyeccionFutura:Map<string, Asignatura[]>, numeroUltimoSemestre: number): CreacionSemestre[]
    {
        let numeroSemestre: number = numeroUltimoSemestre;
        const arraySemestres: CreacionSemestre[] = [];
        for(const[periodo, asignaturas] of proyeccionFutura)
        {
            let creditosTotales = 0;
            let instanciaAsignatura: CreacionInstanciaAsignatura[] = asignaturas.map(instance => {

                creditosTotales += instance.creditos;

                return {
                    aprobada: true,
                    asignatura: {
                        codigoAsignatura: instance.codigo,
                    }
                };
            });
            
            const semestre: CreacionSemestre = {
                numero: numeroSemestre,
                periodo: periodo,
                totalCreditos: creditosTotales,
                instancias: instanciaAsignatura
            };

            arraySemestres.push(semestre);

            numeroSemestre++;
        }
        return arraySemestres;
    }

    crearArrayDeSemestresAvance(avance: Map<string, AvanceConAsignatura[]>): CreacionSemestre[]
    {
        let numeroSemestre: number = 1;
        const arraySemestres: CreacionSemestre[] = [];
        for(const[periodo, asignaturas] of avance)
        {
            let creditosTotales = 0;
            let instanciaAsignatura: CreacionInstanciaAsignatura[] = asignaturas.map(instance => {
                
                const asignaturaOriginal = instance.getCourse();

                creditosTotales += asignaturaOriginal.creditos;

                return {
                    aprobada: (instance.getStatus() === 'APROBADO'),
                    asignatura: {
                        codigoAsignatura: asignaturaOriginal.codigo,
                    }
                };
            });
            
            const semestre: CreacionSemestre = {
                numero: numeroSemestre,
                periodo: periodo,
                totalCreditos: creditosTotales,
                instancias: instanciaAsignatura
            };

            arraySemestres.push(semestre);

            const tipoSemestre = periodo.slice(4, 6);
            
            if (tipoSemestre !== '15' && tipoSemestre !== '25') {
                numeroSemestre++;
            }
            
        }
        return arraySemestres;
    }

    async crearProyeccionConAvance(rut: string, catalogo: string, codigoCarrera: string, proyeccion: CreacionProyeccion)
    {

        const avance = await this.avanceService.fetchAvanceData(rut, codigoCarrera);
        const malla = await this.mallaService.fetchMallaCarrera(codigoCarrera,catalogo);
        const avanceRelleno: AvanceConAsignatura[] = this.avanceService.rellenarListaDeAvance(avance, malla);
        const avanceSeparado: Map<string, AvanceConAsignatura[]> = this.avanceService.avanceSeparadoPorPeriodo(avanceRelleno);

        const arraySemestres = this.crearArrayDeSemestresAvance(avanceSeparado);
        
        this.cargarAsignaturasBaseDeDatos(malla);

        const nuevaProyeccion = this.crearProyeccion(rut, proyeccion, arraySemestres);

        return await this.proyeccionRepository.save(nuevaProyeccion);
    }

    async prepararDatosParaProyeccion(rutAlumno: string, codigoCarrera: string,  catalogo: string)
    {
        const avance = await this.avanceService.fetchAvanceData(rutAlumno,codigoCarrera);
        const malla = await this.mallaService.fetchMallaCarrera(codigoCarrera,catalogo);

        const listaDeAvanceConAsignatura = this.avanceService.rellenarListaDeAvance(avance, malla);
        const asignaturasAprobadas = this.asignaturasAprobadas(listaDeAvanceConAsignatura); 

        const avanceSeparado = this.avanceService.avanceSeparadoPorPeriodo(listaDeAvanceConAsignatura);
        const ultimoPeriodo = this.avanceService.sacarUltimoPeriodo(avanceSeparado);

        const mallaSeparada = this.mallaService.mallaSeparadaEnSemestres(malla);
        const aparicionesPrerrequisitos = this.mallaService.asignaturasCantidadAparicionesPrerrequisitos(malla);

        return {
            mallaSeparada,
            aparicionesPrerrequisitos,
            asignaturasAprobadas,
            ultimoPeriodo
        };        
    }

    async obtenerAsignaturasProyeccionManual(rutAlumno:string, codigoCarrera:string, catalogo:string)
    {
        const datosProyeccion = await this.prepararDatosParaProyeccion(rutAlumno, codigoCarrera, catalogo);

        const proyeccionManual = new ProyeccionManual(
            datosProyeccion.mallaSeparada, 
            datosProyeccion.aparicionesPrerrequisitos, 
            datosProyeccion.asignaturasAprobadas, 
            datosProyeccion.ultimoPeriodo
        );

        return proyeccionManual.enviarAsignaturas();
    }

    async obtenerEstadisticas(periodo: string) 
    {
        /* Query: Busca todas las instancias (ramos inscritos en proyecciones),
           filtra por el periodo (ej: '202510'), agrupa por asignatura 
           y cuenta cuántas veces se repite.
        */
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
