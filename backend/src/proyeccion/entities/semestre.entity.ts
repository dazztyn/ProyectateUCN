import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Proyeccion } from './proyeccion.entity'; // Importa la entidad padre
import { InstanciaAsignatura } from './InstanciaAsignatura.entity';

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

// --- RELACIÓN MODIFICADA ---
  // Un Semestre ahora tiene muchas "Instancias" de asignaturas
  @OneToMany(() => InstanciaAsignatura, (instancia) => instancia.semestre, {
    cascade: true, // 👈 Mantenemos la cascada aquí
  })
  instancias: InstanciaAsignatura[];
}