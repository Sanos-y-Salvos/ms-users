// Seed de usuario administrador fijo
// Se ejecuta en cada arranque del servidor.
// Es idempotente: si el admin ya existe (por email), no hace nada.

import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { AppDataSource } from '../config/db';
import { User, RolUsuario, TipoUsuario } from '../models/User';
import { Ciudadano } from '../models/Ciudadano';

// ── Credenciales del admin fijo (configurable por variables de entorno) ──────
const ADMIN_EMAIL     = process.env.SEED_ADMIN_EMAIL     || 'admin@sanosysalvos.cl';
const ADMIN_PASSWORD  = process.env.SEED_ADMIN_PASSWORD  || 'Admin1234!';
const ADMIN_NOMBRE    = process.env.SEED_ADMIN_NOMBRE    || 'Administrador';
const ADMIN_APELLIDO  = process.env.SEED_ADMIN_APELLIDO  || 'Sistema';
const ADMIN_TELEFONO  = process.env.SEED_ADMIN_TELEFONO  || '+56900000000';
const ADMIN_REGION    = process.env.SEED_ADMIN_REGION    || 'RM';
const ADMIN_COMUNA    = process.env.SEED_ADMIN_COMUNA    || 'Santiago';
const ADMIN_RUN       = process.env.SEED_ADMIN_RUN       || '99999999-9';
const ADMIN_DIRECCION = process.env.SEED_ADMIN_DIRECCION || 'Dirección interna del sistema';

export async function seedAdminUser(): Promise<void> {
  const userRepo      = AppDataSource.getRepository(User);
  const ciudadanoRepo = AppDataSource.getRepository(Ciudadano);

  // Verificar si el admin ya existe (idempotente)
  const existente = await userRepo.findOne({ where: { email: ADMIN_EMAIL.toLowerCase() } });
  if (existente) {
    console.log(`[seed] Admin ya existe (${ADMIN_EMAIL}), omitiendo creación.`);
    return;
  }

  // Crear el User base con rol SUPERADMIN
  const credentialId = uuidv4();
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const user = userRepo.create({
    credential_id: credentialId,
    email:         ADMIN_EMAIL.toLowerCase(),
    password_hash: passwordHash,
    telefono:      ADMIN_TELEFONO,
    region:        ADMIN_REGION,
    comuna:        ADMIN_COMUNA,
    rol:           RolUsuario.SUPERADMIN,
    tipo:          TipoUsuario.CIUDADANO,
    is_active:     true,
  });

  await userRepo.save(user);

  // Crear el perfil Ciudadano asociado
  const ciudadano = ciudadanoRepo.create({
    user,
    primer_nombre:    ADMIN_NOMBRE,
    apellido_paterno: ADMIN_APELLIDO,
    run:              ADMIN_RUN,
    direccion:        ADMIN_DIRECCION,
  });

  await ciudadanoRepo.save(ciudadano);

  console.log(`[seed] ✅ Admin fijo creado: ${ADMIN_EMAIL} (rol: superadmin)`);
}
