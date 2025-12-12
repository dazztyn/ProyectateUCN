import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('roles_usuarios')
export class RolUsuario {
  @PrimaryColumn({ type: 'text' })
  email: string;

  @Column({ type: 'text', nullable: true })
  password: string;

  @Column({ type: 'text', default: 'student' })
  rol: string; 

  @Column({ type: 'text', nullable: true })
  rut: string;
}