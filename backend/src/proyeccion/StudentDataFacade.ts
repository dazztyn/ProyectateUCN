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
        // =========================================================
        // 2. FASE DE LECTURA (Leer de BD a velocidad luz ⚡)
        // =========================================================
        // Ya no dependemos de la respuesta HTTP, leemos directo del disco/memoria de la BD.
        const [avancePorPeriodoMap, mallaRaw] = await Promise.all([
            this.avanceService.obtenerAvanceDesdeBD(rut, codigoCarrera), 
            this.mallaService.obtenerMallaRaw(codigoCarrera)
        ]);

        // =========================================================
        // 3. FASE DE PROCESAMIENTO (Cálculos en Memoria)
        // =========================================================

        // A. Convertir avancePorPeriodo a Map y Lista Plana
        const avanceMap = new Map<string, AvancePlano[]>(Object.entries(avancePorPeriodoMap));

        const avancePlanoLista = Object.values(avancePorPeriodoMap).flat() as AvancePlano[];

        // B. Calcular Aprobados (Set para búsqueda O(1))
        const asignaturasAprobadas = new Set<string>();
        avancePlanoLista.forEach(ramo => {
            // Tu lógica de negocio: ¿Qué cuenta como aprobado?
            if (ramo.estado === 'APROBADO' || ramo.estado === 'INSCRITO' || ramo.estado === 'CONVALIDADO') {
                asignaturasAprobadas.add(ramo.codigo);
            }
        });

        // C. Calcular Último Periodo
        // Obtenemos las llaves (ej: "202310", "202320") y las ordenamos
        const periodos = Object.keys(avancePorPeriodoMap).sort();
        const ultimoPeriodo = periodos.length > 0 ? periodos[periodos.length - 1] : '202300'; // Valor default seguro

        // D. Procesar Malla (Agrupar y Grafos)
        // Usamos los utils con la data plana que vino de la BD
        const mallaPorNiveles = this.academicUtils.agruparPor(mallaRaw, (a) => a.nivel);
        const grafoPrerrequisitos = this.academicUtils.construirGrafoDeApertura(mallaRaw);

        // =========================================================
        // 4. RETORNO
        // =========================================================
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