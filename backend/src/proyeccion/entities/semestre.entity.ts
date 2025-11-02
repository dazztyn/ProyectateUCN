import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Proyeccion } from './proyeccion.entity'; // Importa la entidad padre
import { Asignaturas } from './asignatura.entity'; // Importa la entidad hija

@Entity('semestres')
export class Semestre {
  @PrimaryGeneratedColumn()
  idSemestre: number;

  @Column({ type: 'int', nullable: false })
  numero: number;

  @Column({ type: 'text', nullable: false })
  periodo: string;

  @Column({ type: 'int', nullable: false })
  totalCreditos: number;

  // --- RELACIÓN CON PROYECCION ---
  // Muchos Semestres pertenecen a una Proyeccion.
  // Este es el lado que tendrá la columna de la llave foránea ('proyeccionIdProyeccion').
  @ManyToOne(() => Proyeccion, (proyeccion) => proyeccion.semestres)
  proyeccion: Proyeccion;

  // --- RELACIÓN CON ASIGNATURA ---
  // Un Semestre tiene muchas Asignaturas.
  @OneToMany(() => Asignaturas, (asignatura) => asignatura.semestre, {cascade: true,})
  asignaturas: Asignaturas[];
}