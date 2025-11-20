import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Semestre } from './semestre.entity';
import { Asignaturas } from './asignatura.entity';

@Entity('instancias_asignaturas')
export class InstanciaAsignatura {
  @PrimaryGeneratedColumn()
  id: number;

  // --- TU NUEVA COLUMNA ---
  @Column({ type: 'boolean', default: false })
  aprobada: boolean;

  // --- RELACIÓN CON SEMESTRE ---
  @ManyToOne(() => Semestre, (semestre) => semestre.instancias)
  semestre: Semestre;

  // --- RELACIÓN CON ASIGNATURA ---
  @ManyToOne(() => Asignaturas, (asignatura) => asignatura.instancias)
  asignatura: Asignaturas;
}