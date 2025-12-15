import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstanciaAsignatura } from '../proyeccion/entities/InstanciaAsignatura.entity'; // Asegúrate de que la ruta de importación sea correcta

@Injectable()
export class EstadisticasService {
  constructor(
    @InjectRepository(InstanciaAsignatura)
    private readonly instanciaRepository: Repository<InstanciaAsignatura>,
  ) {}

  async obtenerEstadisticas(periodo: string) {
    const resultado = await this.instanciaRepository
      .createQueryBuilder('instancia')
      .leftJoin('instancia.semestre', 'semestre')
      .leftJoinAndSelect('instancia.asignatura', 'asignatura')
      .select('asignatura.nombreAsignatura', 'nombre')
      .addSelect('asignatura.codigoAsignatura', 'codigo')
      .addSelect('COUNT(instancia.id)', 'total')            // Cuenta cuántas veces aparece
      .where('semestre.periodo = :periodo', { periodo }) // filtrar por periodo recibido
      .groupBy('asignatura.codigoAsignatura')           // agrupar por código de asignatura
      .addGroupBy('asignatura.nombreAsignatura')
      .orderBy('total', 'DESC')                         // ordenar de mayor a menor
      .limit(20)
      .getRawMany();

    return resultado;
  }
}