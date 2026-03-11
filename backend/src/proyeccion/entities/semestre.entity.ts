import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Proyeccion } from './proyeccion.entity'; // Importa la entidad padre
import { InstanciaAsignatura } from './InstanciaAsignatura.entity';

@Entity('semestres')
export class Semestre {
  @PrimaryGeneratedColumn()
  idSemestre: number;

  @Column({ type: 'boolean', nullable: false })
  editable: boolean;

  @Column({ type: 'int', nullable: false })
  numero: number;

  @Column({ type: 'text', nullable: false })
  periodo: string;

  @Column({ type: 'int', nullable: false })
  totalCreditos: number;

  @ManyToOne(() => Proyeccion, (proyeccion) => proyeccion.semestres,
  {
    onDelete: 'CASCADE',
  })
  proyeccion: Proyeccion;

  @OneToMany(() => InstanciaAsignatura, (instancia) => instancia.semestre, {
    cascade: true, 
  })
  instancias: InstanciaAsignatura[];
}