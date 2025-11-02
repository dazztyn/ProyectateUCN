import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Semestre } from './semestre.entity'; // Importa la entidad hija

@Entity('proyecciones') // Nombre de la tabla en la base de datos
export class Proyeccion {
  @PrimaryGeneratedColumn()
  idProyeccion: number;

  @Column({ type: 'text', nullable: false })
  rutUsuario: string;

  @Column({ type: 'boolean', nullable: false })
  ideal: boolean;

  @Column({ type: 'text', nullable: false })
  nombreProyeccion: string;

  // --- RELACIÓN ---
  // Una Proyeccion tiene muchos Semestres.
  // El segundo argumento '(semestre) => semestre.proyeccion' le indica a TypeORM
  // que en la entidad 'Semestre' hay una propiedad 'proyeccion' que nos conecta de vuelta.
  @OneToMany(() => Semestre, (semestre) => semestre.proyeccion, {cascade: true,})
  semestres: Semestre[];
}