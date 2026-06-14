// Decoradores de TypeORM para definir la entidad
import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToOne, JoinColumn
} from 'typeorm';
// Entidad relacionada
import { User } from './User';

// Tipos de institución soportados (rol derivado)
export enum TipoInstitucion {
  MUNICIPALIDAD = 'municipalidad',
  VETERINARIA = 'veterinaria',
}

// Entidad que mapea la tabla 'instituciones'
@Entity('instituciones')
export class Institucion {
  // PK UUID generada por la BD
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Relación 1:1 con User (lado dueño con FK user_id)
  @OneToOne(() => User, (user) => user.institucion)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  // Nombre comercial visible
  @Column()
  nombre_institucion!: string;

  // Razón social formal
  @Column()
  razon_social!: string;

  // RUT único de la institución
  @Column({ unique: true })
  rut!: string;

  // Tipo (municipalidad o veterinaria)
  @Column({ type: 'enum', enum: TipoInstitucion })
  tipo_institucion!: TipoInstitucion;

  // Dirección física
  @Column()
  direccion!: string;
}
