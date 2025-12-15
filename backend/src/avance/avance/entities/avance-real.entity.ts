import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

@Entity('avance_real')
@Unique(['rutUsuario', 'codigoCarrera', 'codigoAsignatura']) // 🔒 Llave única compuesta
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
    nombreAsignatura: string; // Guardamos el nombre para consultar rápido sin JOINs

    @Column({ type: 'int', nullable: true }) 
    creditos: number;

    @Column()
    periodo: string; // Ej: "202310"

    @Column()
    estado: string; // 'APROBADO', 'REPROBADO', 'INSCRITO', 'CONVALIDADO'

    @Column({ type: 'float', nullable: true })
    nota: number;

    @Column({ type: 'int', default: 1 })
    vez: number; // Opcional: Para saber si es el 1er, 2do o 3er intento
}