import { Injectable } from '@nestjs/common';
import { AvanceService } from '../avance/avance/avance.service.js';
import { MallaService } from '../mallacurricular/malla/malla.service.js';
import { ProyeccionFutura } from './ProyeccionFutura.js';
import { AvanceConAsignatura } from '../avance/avance/AvanceConAsignatura.js';
import { Asignatura } from '../ArchivosComunes/Asignatura.js';


@Injectable()
export class ProyeccionService 
{
    constructor(private readonly avanceService: AvanceService, private readonly mallaService: MallaService) {}

    asignaturasAprobadas(avance: AvanceConAsignatura[]): string[]
    {
        return avance
        .filter(item => item != null && item.getCourse() != null && (item.getStatus() === 'APROBADO' || item.getStatus() === 'INSCRITO'))
            .map(item => item.getCourse().codigo);
    }

    async proyeccionFutura(rutAlumno:string, codigoCarrera:string, catalogo:string)
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
}
