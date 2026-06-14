// Decoradores de TypeORM para definir la entidad y relaciones
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  OneToOne
} from 'typeorm';
// Entidades relacionadas (1:1 según tipo)
import { Ciudadano } from './Ciudadano';
import { Institucion } from './Institucion';

// Roles soportados por la plataforma
export enum RolUsuario {
  CIUDADANO = 'ciudadano',
  VETERINARIA = 'veterinaria',
  MUNICIPALIDAD = 'municipalidad',
  MODERADOR = 'moderador',
  ADMINISTRADOR = 'administrador',
  SUPERADMIN = 'superadmin',
}

// Discriminador entre persona y organización
export enum TipoUsuario {
  CIUDADANO = 'ciudadano',
  INSTITUCION = 'institucion',
}

// Entidad que mapea la tabla 'users'
@Entity('users')
export class User {
  // PK UUID generada por la BD
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Identificador de credencial (link con servicio de auth)
  @Column({ unique: true })
  credential_id!: string;

  // Email único usado para login
  @Column({ unique: true })
  email!: string;

  // Hash bcrypt de la contraseña
  @Column()
  password_hash!: string;

  // Teléfono de contacto
  @Column()
  telefono!: string;

  // URL de foto de perfil en Cloudinary (opcional)
  @Column({ nullable: true })
  foto_perfil!: string;

  // Rol que define permisos
  @Column({ type: 'enum', enum: RolUsuario, default: RolUsuario.CIUDADANO })
  rol!: RolUsuario;

  // Tipo de cuenta (ciudadano o institución)
  @Column({ type: 'enum', enum: TipoUsuario })
  tipo!: TipoUsuario;

  // Región (código administrativo)
  @Column()
  region!: string;

  // Comuna
  @Column()
  comuna!: string;

  // Estado activo (soft delete)
  @Column({ default: true })
  is_active!: boolean;

  // Timestamp de creación
  @CreateDateColumn()
  created_at!: Date;

  // Timestamp de última actualización
  @UpdateDateColumn()
  updated_at!: Date;

  // Datos del ciudadano (si tipo=ciudadano)
  @OneToOne(() => Ciudadano, (ciudadano) => ciudadano.user)
  ciudadano!: Ciudadano;

  // Datos de la institución (si tipo=institucion)
  @OneToOne(() => Institucion, (institucion) => institucion.user)
  institucion!: Institucion;
}
