import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

@Entity('avance_real')
@Unique(['rutUsuario', 'codigoCarrera', 'codigoAsignatura', 'periodo'])
export class AvanceReal {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    rutUsuario: string;

    @Column({ nullable: true }) 
    nrc: string;

    @Column()
    codigoCarrera: string;

    @Column()
    codigoAsignatura: string;

    @Column()
    nombreAsignatura: string; 

    @Column({ type: 'int', nullable: true }) 
    creditos: number;

    @Column()
    periodo: string;

    @Column()
    estado: string;

    @Column({ type: 'float', nullable: true })
    nota: number;

    @Column({ type: 'int', default: 1 })
    vez: number; 
}