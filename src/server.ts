// Habilita metadatos requeridos por TypeORM (decoradores)
import 'reflect-metadata';
// Cliente pg para verificar/crear la base de datos antes de TypeORM
import { Client } from 'pg';
// Instancia Express configurada
import app from './app';
// DataSource de TypeORM
import { AppDataSource } from './config/db';
// Carga variables del archivo .env
import dotenv from 'dotenv';
dotenv.config();

// Puerto del servicio, con fallback a 3002
const PORT = process.env.PORT || 3002;
// Nombre de la base de datos, con fallback a ms_users
const DB_NAME = process.env.DB_NAME || 'ms_users';

// Garantiza que la base de datos exista antes de inicializar TypeORM
async function ensureDatabase() {
  // Cliente conectado a la base 'postgres' (sistema) para crear la base destino
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres',
  });
  // Abre la conexión
  await client.connect();
  // Consulta si la base destino ya existe
  const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [DB_NAME]);
  // Si no existe, la crea
  if (res.rowCount === 0) {
    await client.query(`CREATE DATABASE "${DB_NAME}"`);
    console.log(`🗄️  Base de datos "${DB_NAME}" creada`);
  }
  // Cierra la conexión auxiliar
  await client.end();
}

// Flujo de arranque: asegura BD → inicializa TypeORM → levanta servidor
ensureDatabase()
  .then(() => AppDataSource.initialize())
  .then(() => {
    // Log de conexión exitosa
    console.log('✅ Conexión a PostgreSQL establecida');
    // Inicia el servidor HTTP en el puerto configurado
    app.listen(PORT, () => {
      console.log(`🚀 MS-Users corriendo en http://localhost:${PORT}`);
    });
  })
  // Captura cualquier error de arranque y lo imprime
  .catch((err) => {
    console.error('❌ Error al iniciar el servidor:', err);
  });
