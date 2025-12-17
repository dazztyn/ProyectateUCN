import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstanciaAsignatura } from '../proyeccion/entities/InstanciaAsignatura.entity';

@Injectable()
export class EstadisticasService {
  constructor(
    @InjectRepository(InstanciaAsignatura)
    private readonly instanciaRepo: Repository<InstanciaAsignatura>,
  ) {}

  // 1. ASIGNATURAS MÁS DEMANDADAS (Más inscritos en X semestre)
  async obtenerMasDemandadas(codigoCarrera: string, periodo: string, limite: number = 10) {
    const resultados = await this.instanciaRepo.createQueryBuilder('instancia')
      .innerJoin('instancia.asignatura', 'asignatura')
      .innerJoin('instancia.semestre', 'semestre')
      .where('asignatura.codigoCarrera = :codigoCarrera', { codigoCarrera })
      .andWhere('semestre.periodo = :periodo', { periodo })
      .select([
        'asignatura.codigoAsignatura AS codigo',
        'asignatura.nombreAsignatura AS nombre',
      ])
      .addSelect('COUNT(instancia.id)', 'total_inscritos')
      .groupBy('asignatura.codigoAsignatura')
      .addGroupBy('asignatura.nombreAsignatura')
      .orderBy('COUNT(instancia.id)', 'DESC')
      .limit(limite)
      .getRawMany();

    return resultados.map(r => ({
      codigo: r.codigo,
      nombre: r.nombre,
      total_inscritos: parseInt(r.total_inscritos, 10) // ✅ Cambiar 'inscritos' a 'total_inscritos'
    }));
  }

  // 2. RANKING REPROBACIÓN 
  async obtenerRankingReprobacion(codigoCarrera: string, limite: number = 10, periodo?: string) {
    const query = this.instanciaRepo.createQueryBuilder('instancia')
      .innerJoin('instancia.asignatura', 'asignatura')
      .leftJoin('instancia.semestre', 'semestre') 
      .where('asignatura.codigoCarrera = :codigoCarrera', { codigoCarrera })
      .andWhere("instancia.estado IN (:...estados)", { estados: ['APROBADO', 'REPROBADO'] });
    if (periodo) {
      query.andWhere('semestre.periodo = :periodo', { periodo });
    }

    const resultados = await query
      .select([
        'asignatura.codigoAsignatura AS codigo',
        'asignatura.nombreAsignatura AS nombre',
      ])
      .addSelect('COUNT(instancia.id)', 'total_intentos')
      .addSelect(`SUM(CASE WHEN instancia.estado = 'REPROBADO' THEN 1 ELSE 0 END)`, 'total_reprobados')
      .groupBy('asignatura.codigoAsignatura')
      .addGroupBy('asignatura.nombreAsignatura')
      .orderBy('(SUM(CASE WHEN "instancia"."estado" = \'REPROBADO\' THEN 1 ELSE 0 END))::float / COUNT("instancia"."id")', 'DESC')
      .limit(limite)
      .getRawMany();

    return resultados.map(row => {
      const total = parseInt(row.total_intentos);
      const reprobados = parseInt(row.total_reprobados);

      return {
        codigo: row.codigo,
        nombre: row.nombre,
        total_intentos: total,        // ✅ Cambiar 'totalCursado' a 'total_intentos'
        total_reprobados: reprobados  // ✅ Cambiar 'totalReprobado' a 'total_reprobados'
      };
    });
  }
}