import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Unique } from 'typeorm';
import { Semestre } from './semestre.entity'; 

@Entity('proyecciones') 
@Unique(['rutUsuario', 'nombreProyeccion', 'codigoCarrera']) 
export class Proyeccion {
  @PrimaryGeneratedColumn()
  idProyeccion: number;

  @Column({ type: 'text', nullable: false })
  codigoCarrera: string;

  @Column({ type: 'text', nullable: false })
  rutUsuario: string;

  @Column({ type: 'boolean', nullable: false })
  ideal: boolean;

  @Column({ type: 'text', nullable: false })
  nombreProyeccion: string;

  @OneToMany(() => Semestre, (semestre) => semestre.proyeccion, 
  {
    cascade: true,
    onDelete: 'CASCADE'
  })
  semestres: Semestre[];
}