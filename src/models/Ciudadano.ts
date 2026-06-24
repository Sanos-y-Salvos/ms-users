// Decoradores de TypeORM
import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToOne, JoinColumn
} from 'typeorm';
// Entidad relacionada
import { User } from './User';

// Entidad que mapea la tabla 'ciudadanos'
@Entity('ciudadanos')
export class Ciudadano {
  // PK UUID
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Relación 1:1 con User (lado dueño con FK user_id)
  @OneToOne(() => User, (user) => user.ciudadano)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  // Primer nombre (obligatorio)
  @Column()
  primer_nombre!: string;

  // Segundo nombre (opcional)
  @Column({ nullable: true })
  segundo_nombre!: string;

  // Primer apellido (obligatorio)
  @Column()
  apellido_paterno!: string;

  // Segundo apellido (opcional)
  @Column({ nullable: true })
  apellido_materno!: string;

  // RUN chileno único
  @Column({ unique: true })
  run!: string;

  // Dirección particular
  @Column()
  direccion!: string;
}
