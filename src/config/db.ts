// DataSource de TypeORM
import { DataSource } from 'typeorm';
// Entidades del dominio
import { User } from '../models/User';
import { Ciudadano } from '../models/Ciudadano';
import { Institucion } from '../models/Institucion';
import { PasswordResetOtp } from '../models/PasswordResetOtp';
// Carga variables de entorno
import dotenv from 'dotenv';
dotenv.config();

// DataSource principal usado por toda la app para acceder a Postgres
export const AppDataSource = new DataSource({
  // Motor PostgreSQL
  type: 'postgres',
  // Parámetros de conexión desde .env
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Sincroniza el esquema con las entidades en cada arranque (solo dev)
  synchronize: true,
  // Desactiva logs SQL
  logging: false,
  // Lista de entidades manejadas por el ORM
  entities: [User, Ciudadano, Institucion, PasswordResetOtp],
});
