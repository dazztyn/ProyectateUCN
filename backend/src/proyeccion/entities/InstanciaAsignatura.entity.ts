import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Semestre } from './semestre.entity';
import { Asignaturas } from './asignatura.entity';

@Entity('instancias_asignaturas')
export class InstanciaAsignatura {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 'PENDIENTE' })
  estado: string;

  @ManyToOne(() => Semestre, (semestre) => semestre.instancias)
  semestre: Semestre;

  @ManyToOne(() => Asignaturas, (asignatura) => asignatura.instancias)
  asignatura: Asignaturas;
}