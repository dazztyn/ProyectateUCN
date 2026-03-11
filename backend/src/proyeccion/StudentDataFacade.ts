import { Injectable } from '@nestjs/common';
import { MallaService } from '../mallacurricular/malla/malla.service';
import { AvanceService } from '../avance/avance/avance.service';
import { AcademicUtilsService } from '../ArchivosComunes/AcademicUtilsService';
import { EstadoAcademico, AvancePlano } from './interfaces/EstadoAcademico';

@Injectable()
export class StudentDataFacade {
    constructor(
        private readonly mallaService: MallaService,
        private readonly avanceService: AvanceService,
        private readonly academicUtils: AcademicUtilsService
    ) {}

    async obtenerEstadoAcademico(rut: string, codigoCarrera: string, catalogo: string): Promise<EstadoAcademico> 
    {

        const [avancePorPeriodoMap, mallaRaw] = await Promise.all([
            this.avanceService.obtenerAvanceDesdeBD(rut, codigoCarrera), 
            this.mallaService.obtenerMallaRaw(codigoCarrera)
        ]);


        const avanceMap = new Map<string, AvancePlano[]>(Object.entries(avancePorPeriodoMap));

        const avancePlanoLista = Object.values(avancePorPeriodoMap).flat() as AvancePlano[];

        const asignaturasAprobadas = new Set<string>();
        avancePlanoLista.forEach(ramo => {
            if (ramo.estado === 'APROBADO' || ramo.estado === 'INSCRITO' || ramo.estado === 'CONVALIDADO') {
                asignaturasAprobadas.add(ramo.codigo);
            }
        });

        const periodos = Object.keys(avancePorPeriodoMap).sort();
        const ultimoPeriodo = periodos.length > 0 ? periodos[periodos.length - 1] : '202300';

        const mallaPorNiveles = this.academicUtils.agruparPor(mallaRaw, (a) => a.nivel);
        const grafoPrerrequisitos = this.academicUtils.construirGrafoDeApertura(mallaRaw);

        return {
            mallaCompleta: mallaRaw,
            mallaPorNiveles,
            avancePorPeriodo: avanceMap,
            avancePlanoLista: avancePlanoLista,
            asignaturasAprobadas,
            ultimoPeriodo,
            grafoPrerrequisitos
        };
    }
}