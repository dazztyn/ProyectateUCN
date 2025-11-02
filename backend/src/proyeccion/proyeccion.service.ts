import { Injectable } from '@nestjs/common';
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
                private asignaturaRepository: Repository<Asignatura>
                ){}

    asignaturasAprobadas(avance: AvanceConAsignatura[]): string[]
    {
        return avance
        .filter(item => item != null && item.getCourse() != null && (item.getStatus() === 'APROBADO' || item.getStatus() === 'INSCRITO'))
            .map(item => item.getCourse().codigo);
    }

    async proyeccionFutura(rutAlumno:string, codigoCarrera:string, catalogo:string,  idProyeccion: string)
    {
        const avance =  await this.avanceService.fetchAvanceData(rutAlumno,codigoCarrera);
        const malla = await this.mallaService.fetchMallaCarrera(codigoCarrera,catalogo);

        const listaDeAvanceConAsignatura = this.avanceService.rellenarListaDeAvance(avance, malla);

        let asignaturasAprobadas = this.asignaturasAprobadas(listaDeAvanceConAsignatura);

        let aparicionesPrerrequisitos = this.mallaService.asignaturasCantidadAparicionesPrerrequisitos(malla);
        let avanceSeparado = this.avanceService.avanceSeparadoPorPeriodo(listaDeAvanceConAsignatura);
        let mallaSeparada = this.mallaService.mallaSeparadaEnSemestres(malla);

        const ultimoPeriodo = this.avanceService.sacarUltimoPeriodo(avanceSeparado);

        const proyeccion = new ProyeccionFutura(mallaSeparada, aparicionesPrerrequisitos, asignaturasAprobadas, ultimoPeriodo);

        let proyeccionOptima: Map<string, Asignatura[]> = proyeccion.generarProyeccionOptima();

        return Object.fromEntries(proyeccionOptima);
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

    crearArrayDeSemestres(avance: Map<string, AvanceConAsignatura[]>): CreacionSemestre[]
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

        const arraySemestres = this.crearArrayDeSemestres(avanceSeparado);
        
        const nuevaProyeccion = this.proyeccionRepository.create( 
        {
            rutUsuario: rut,
            ideal: proyeccion.ideal,
            nombreProyeccion: proyeccion.nombreProyeccion,
            semestres: arraySemestres,
        })

        return await this.proyeccionRepository.save(nuevaProyeccion);
    }
}
