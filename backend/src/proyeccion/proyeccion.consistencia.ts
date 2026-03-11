import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Semestre } from './entities/semestre.entity';
import { InstanciaAsignatura } from './entities/InstanciaAsignatura.entity';
import { Asignatura } from '../ArchivosComunes/Asignatura';

@Injectable()
export class ProyeccionConsistencyService {
    constructor(private readonly dataSource: DataSource) {}


    async validarYCorregir(
        semestres: Semestre[], 
        mallaCompleta: Asignatura[], 
        aprobadosIniciales: Set<string>,
        periodoBase: string, 
        periodoProtegido?: string
    ): Promise<boolean> {
        
        const aprobadosAcumulados = new Set(aprobadosIniciales);

        const mallaOrdenada = mallaCompleta.sort((a, b) => a.nivel - b.nivel);

        const semestresOrdenados = semestres.sort((a, b) => a.numero - b.numero);

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            let huboCambios = false;

            for (const semestre of semestresOrdenados) {

                if (!semestre.editable) 
                {
                    semestre.instancias.forEach(i => {
                            if (i.asignatura) {
                                aprobadosAcumulados.add(i.asignatura.codigoAsignatura);
                            }
                        });
                    continue;
                }

                const esProtegido = periodoProtegido && semestre.periodo === periodoProtegido;


                let nivelMaximo = 999;
                if (!esProtegido) {
                    const nivelMasAtrasado = this.calcularNivelMasAtrasado(mallaOrdenada, aprobadosAcumulados);
                    nivelMaximo = nivelMasAtrasado + 2;
                }

                const instanciasValidas: InstanciaAsignatura[] = [];

                if (semestre.instancias) {
                    for (const instancia of semestre.instancias) {
                        
                        if (!instancia.asignatura) {
                            await queryRunner.manager.remove(instancia);
                            huboCambios = true;
                            continue; 
                        }

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


                semestre.instancias = instanciasValidas;
                const nuevosCreditos = instanciasValidas.reduce((acc, i) => acc + (i.asignatura?.creditos || 0), 0);
                
                if (semestre.totalCreditos !== nuevosCreditos) {
                    semestre.totalCreditos = nuevosCreditos;
                    await queryRunner.manager.save(semestre);
                    huboCambios = true;
                }
            }

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
    
    private calcularNivelMasAtrasado(malla: Asignatura[], aprobados: Set<string>): number {
        for (const ramo of malla) {
            if (!aprobados.has(ramo.codigo)) return ramo.nivel;
        }
        return 0; 
    }

    private esAsignaturaValida(asignatura: any, nivelMaximo: number, aprobados: Set<string>): boolean {
        if (!asignatura) return false;
        
        if (asignatura.nivel > nivelMaximo) return false;

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
        

        const muertos = semestresEditables.filter(s => s.instancias.length === 0);
        if (muertos.length > 0) {
            await qr.manager.remove(muertos);
            cambios = true;
        }

        const vivos = semestresEditables.filter(s => s.instancias.length > 0);
        let periodoRastreo = periodoPivote;

        const ultimoFijo = semestres.filter(s => !s.editable).pop();
        let numeroRastreo = ultimoFijo ? ultimoFijo.numero : 0;

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