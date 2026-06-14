// Decoradores de TypeORM
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

// Entidad para códigos OTP de recuperación de contraseña
@Entity('password_reset_otps')
export class PasswordResetOtp {
  // Identificador único del OTP
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Email al que se envió el código
  @Column()
  email!: string;

  // Código OTP (6 dígitos)
  @Column()
  code!: string;

  // Fecha/hora absoluta de expiración
  @Column({ type: 'timestamptz' })
  expires_at!: Date;

  // Marca si el OTP ya fue consumido
  @Column({ default: false })
  used!: boolean;

  // Timestamp de creación gestionado por TypeORM
  @CreateDateColumn()
  created_at!: Date;
}
