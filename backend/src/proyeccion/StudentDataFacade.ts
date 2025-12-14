import { Injectable } from '@nestjs/common';
import { MallaService } from '../mallacurricular/malla/malla.service';
import { AvanceService } from '../avance/avance/avance.service';
import { AcademicUtilsService } from '../ArchivosComunes/AcademicUtilsService';
import { EstadoAcademico } from './interfaces/EstadoAcademico';

@Injectable()
export class StudentDataFacade {
    constructor(
        private readonly mallaService: MallaService,
        private readonly avanceService: AvanceService,
        private readonly academicUtils: AcademicUtilsService
    ) {}

    /**
     * Obtiene y prepara TODOS los datos necesarios para realizar una proyección.
     * Realiza fetching en paralelo y pre-calcula grafos.
     */
    async obtenerEstadoAcademico(rut: string, codigoCarrera: string, catalogo: string): Promise<EstadoAcademico> {
        
        // 1. Fetching en paralelo (Mejora de rendimiento: esperamos ambas a la vez)
        const [avanceRaw, mallaRaw] = await Promise.all([
            this.avanceService.fetchAvanceData(rut, codigoCarrera),
            this.mallaService.fetchMallaCarrera(codigoCarrera, catalogo)
        ]);

        // 2. Procesamiento de datos (Cruce de Avance con Malla)
        const avanceRelleno = this.avanceService.rellenarListaDeAvance(avanceRaw, mallaRaw);

        // 3. Agrupaciones y Cálculos
        const avancePorPeriodo = this.avanceService.avanceSeparadoPorPeriodo(avanceRelleno);
        const mallaPorNiveles = this.academicUtils.agruparPor(mallaRaw, (a) => a.nivel);
        const asignaturasAprobadas = this.academicUtils.obtenerCodigosAprobados(avanceRelleno);
        
        // 4. Grafos para algoritmos (Lo que antes hacía MallaService y ProyeccionFutura repetidamente)
        const grafoPrerrequisitos = this.academicUtils.construirGrafoDeApertura(mallaRaw);

        // 5. Obtener último periodo
        const ultimoPeriodo = this.avanceService.sacarUltimoPeriodo(avancePorPeriodo);

        // 6. Retornar el paquete completo
        return {
            mallaCompleta: mallaRaw,
            mallaPorNiveles,
            avanceRelleno,
            avancePorPeriodo,
            asignaturasAprobadas,
            ultimoPeriodo,
            grafoPrerrequisitos
        };
    }
}