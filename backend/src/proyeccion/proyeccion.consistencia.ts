import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Semestre } from './entities/semestre.entity';
import { InstanciaAsignatura } from './entities/InstanciaAsignatura.entity';
import { Asignatura } from '../ArchivosComunes/Asignatura';

@Injectable()
export class ProyeccionConsistencyService {
    constructor(private readonly dataSource: DataSource) {}

    /**
     * Ejecuta la validación de reglas académicas y la defragmentación (Tetris).
     * Retorna true si se realizaron cambios en la base de datos.
     */
    async validarYCorregir(
        semestres: Semestre[], 
        mallaCompleta: Asignatura[], 
        aprobadosIniciales: Set<string>,
        periodoBase: string, // El periodo desde donde empieza el futuro (pivote)
        periodoProtegido?: string
    ): Promise<boolean> {
        
        const aprobadosAcumulados = new Set(aprobadosIniciales);
        // Ordenamos malla por nivel para optimizar búsquedas
        const mallaOrdenada = mallaCompleta.sort((a, b) => a.nivel - b.nivel);
        // Ordenamos semestres cronológicamente
        const semestresOrdenados = semestres.sort((a, b) => a.numero - b.numero);

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            let huboCambios = false;

            // --- FASE 1: SANEAMIENTO ACADÉMICO ---
            for (const semestre of semestresOrdenados) {
                // Si el semestre no es editable, solo acumulamos sus ramos aprobados y seguimos
                if (!semestre.editable) {
                    semestre.instancias?.forEach(i => aprobadosAcumulados.add(i.asignatura.codigoAsignatura));
                    continue;
                }

                const esProtegido = periodoProtegido && semestre.periodo === periodoProtegido;

                // Solo calculamos restricciones si NO es protegido
                let nivelMaximo = 999;
                if (!esProtegido) {
                    const nivelMasAtrasado = this.calcularNivelMasAtrasado(mallaOrdenada, aprobadosAcumulados);
                    nivelMaximo = nivelMasAtrasado + 2;
                }

                const instanciasValidas: InstanciaAsignatura[] = [];
                
                // Filtramos asignaturas inválidas
                if (semestre.instancias) {
                    for (const instancia of semestre.instancias) {
                        
                        const esValida = esProtegido ? true 
                            : this.esAsignaturaValida(instancia.asignatura, nivelMaximo, aprobadosAcumulados);
                        
                        if (esValida) {
                            aprobadosAcumulados.add(instancia.asignatura.codigoAsignatura);
                            instanciasValidas.push(instancia);
                        } else {
                            await queryRunner.manager.remove(instancia);
                            huboCambios = true;
                        }
                    }
                }

                // Actualizamos estado del semestre
                semestre.instancias = instanciasValidas;
                const nuevosCreditos = instanciasValidas.reduce((acc, i) => acc + (i.asignatura?.creditos || 0), 0);
                
                if (semestre.totalCreditos !== nuevosCreditos) {
                    semestre.totalCreditos = nuevosCreditos;
                    await queryRunner.manager.save(semestre);
                    huboCambios = true;
                }
            }

            // --- FASE 2: DEFRAGMENTACIÓN (TETRIS) ---
            if (await this.aplicarTetris(semestresOrdenados, periodoBase, queryRunner)) {
                huboCambios = true;
            }

            await queryRunner.commitTransaction();
            return huboCambios;

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // --- MÉTODOS PRIVADOS (Encapsulamiento de lógica pura) ---

    private calcularNivelMasAtrasado(malla: Asignatura[], aprobados: Set<string>): number {
        for (const ramo of malla) {
            if (!aprobados.has(ramo.codigo)) return ramo.nivel;
        }
        return 0; // Todo aprobado
    }

    private esAsignaturaValida(asignatura: any, nivelMaximo: number, aprobados: Set<string>): boolean {
        if (!asignatura) return false;
        
        // 1. Regla Nivel
        if (asignatura.nivel > nivelMaximo) return false;

        // 2. Regla Prerrequisitos
        if (asignatura.prerrequisitos) {
            const reqs = asignatura.prerrequisitos.split(',').map(r => r.trim());
            const cumpleReqs = reqs.every(r => aprobados.has(r));
            if (!cumpleReqs) return false;
        }

        return true;
    }

    private async aplicarTetris(semestres: Semestre[], periodoPivote: string, qr: any): Promise<boolean> {
        let cambios = false;
        const semestresEditables = semestres.filter(s => s.editable);
        
        // 1. Borrar vacíos
        const muertos = semestresEditables.filter(s => s.instancias.length === 0);
        if (muertos.length > 0) {
            await qr.manager.remove(muertos);
            cambios = true;
        }

        // 2. Reorganizar vivos
        const vivos = semestresEditables.filter(s => s.instancias.length > 0);
        let periodoRastreo = periodoPivote;
        
        // Asumimos que el numeroPivote se infiere del array completo o lógica externa, 
        // pero para simplificar el Tetris puro, recalculamos secuencia lógica.
        // Aquí podrías necesitar pasar el 'numeroPivote' como argumento también si es crítico.
        // Para este ejemplo, usaremos la lógica de periodo.

        // Obtenemos el último número fijo o 0
        const ultimoFijo = semestres.filter(s => !s.editable).pop();
        let numeroRastreo = ultimoFijo ? ultimoFijo.numero : 0;
        
        // Si no hay fijos, y pasamos un periodoPivote, iniciamos desde ahí.
        if (!ultimoFijo) periodoRastreo = periodoPivote; 
        else periodoRastreo = ultimoFijo.periodo;

        for (const sem of vivos) {
            const siguientePeriodo = this.calcularSiguientePeriodo(periodoRastreo);
            const siguienteNumero = numeroRastreo + 1;

            periodoRastreo = siguientePeriodo;
            numeroRastreo = siguienteNumero;

            if (sem.periodo !== siguientePeriodo || sem.numero !== siguienteNumero) {
                sem.periodo = siguientePeriodo;
                sem.numero = siguienteNumero;
                await qr.manager.save(sem);
                cambios = true;
            }
        }
        return cambios;
    }

    private calcularSiguientePeriodo(periodo: string): string {
        const anho = parseInt(periodo.slice(0, 4));
        const sem = parseInt(periodo.slice(4, 6));
        if (sem === 15) return `${anho}20`;
        if (sem === 25) return `${anho + 1}10`;
        if (sem === 10) return `${anho}20`;
        return `${anho + 1}10`;
    }
}