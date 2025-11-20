import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { InstanciaAsignatura } from './InstanciaAsignatura.entity';

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

 // --- NUEVA RELACIÓN ---
  // Una Asignatura (plantilla) puede tener muchas instancias
  @OneToMany(() => InstanciaAsignatura, (instancia) => instancia.asignatura)
  instancias: InstanciaAsignatura[];
}