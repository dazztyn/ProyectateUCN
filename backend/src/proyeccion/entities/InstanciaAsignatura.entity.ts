import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Semestre } from './semestre.entity';
import { Asignaturas } from '../../mallacurricular/entities/asignatura.entity';

@Entity('instancias_asignaturas')
export class InstanciaAsignatura {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 'PENDIENTE' })
  estado: string;

  @ManyToOne(() => Semestre, (semestre) => semestre.instancias,
  {
    onDelete: 'CASCADE'
  })
  semestre: Semestre;

  @ManyToOne(() => Asignaturas, (asignatura) => asignatura.instancias)
  @JoinColumn([
      { name: 'codigoAsignatura', referencedColumnName: 'codigoAsignatura' },
      { name: 'codigoCarrera', referencedColumnName: 'codigoCarrera' }
  ])
  asignatura: Asignaturas;
}