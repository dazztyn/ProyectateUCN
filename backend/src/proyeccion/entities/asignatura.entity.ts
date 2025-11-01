import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
import { Semestre } from './semestre.entity'; // Importa la entidad padre

@Entity('asignaturas')
export class Asignaturas {
  @PrimaryColumn({ type: 'text', nullable: false })
  codigoAsignatura: string;

  @Column({ type: 'text', nullable: false })
  nombreAsignatura: string;

  @Column({ type: 'int', nullable: false })
  creditos: number;

  @Column({ type: 'int', nullable: false })
  nivel: number;

  @Column({ type: 'text', nullable: false })
  prerrequisitos: string;

  // --- RELACIÓN CON SEMESTRE ---
  // Muchas Asignaturas pertenecen a un Semestre.
  // Este lado tendrá la columna de la llave foránea ('semestreIdSemestre').
  @ManyToOne(() => Semestre, (semestre) => semestre.asignaturas)
  semestre: Semestre;
}