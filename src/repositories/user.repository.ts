import { FindOptionsWhere } from 'typeorm';
import { AppDataSource } from '../config/db';
import { User } from '../models/User';

// Helper lazy para obtener el repositorio
const repo = () => AppDataSource.getRepository(User);

// API de acceso a datos de usuarios
export const UserRepository = {
  // Crea una instancia en memoria
  create(data: Partial<User>): User {
    return repo().create(data);
  },

  // Persiste la entidad
  async save(user: User): Promise<User> {
    return repo().save(user);
  },

  // Busca por credential_id, con opciones para filtrar activos y cargar relaciones
  async findByCredentialId(
    credentialId: string,
    opts: { activeOnly?: boolean; withRelations?: boolean } = {},
  ): Promise<User | null> {
    // Arma el where dinámicamente
    const where: FindOptionsWhere<User> = { credential_id: credentialId };
    if (opts.activeOnly) where.is_active = true;
    // Ejecuta el findOne con o sin relaciones
    return repo().findOne({
      where,
      relations: opts.withRelations ? ['ciudadano', 'institucion'] : undefined,
    });
  },

  // Busca por id primario
  async findById(
    id: string,
    opts: { withRelations?: boolean } = {},
  ): Promise<User | null> {
    return repo().findOne({
      where: { id },
      relations: opts.withRelations ? ['ciudadano', 'institucion'] : undefined,
    });
  },

  // Busca por email, opcionalmente solo activos
  async findByEmail(
    email: string,
    opts: { activeOnly?: boolean } = {},
  ): Promise<User | null> {
    const where: FindOptionsWhere<User> = { email };
    if (opts.activeOnly) where.is_active = true;
    return repo().findOne({ where });
  },

  // Lista usuarios con relaciones, ordenados por fecha de creación descendente
  async findAll(where: FindOptionsWhere<User>): Promise<User[]> {
    return repo().find({
      where,
      relations: ['ciudadano', 'institucion'],
      order: { created_at: 'DESC' },
    });
  },

  // Update parcial por credential_id
  async updateByCredentialId(credentialId: string, data: Partial<User>): Promise<void> {
    await repo().update({ credential_id: credentialId }, data);
  },

  // Update parcial por id primario
  async updateById(id: string, data: Partial<User>): Promise<void> {
    await repo().update({ id }, data);
  },

  // Update parcial por email (usado en recuperación de contraseña)
  async updateByEmail(email: string, data: Partial<User>): Promise<void> {
    await repo().update({ email }, data);
  },

  // Admin — Estadísticas agregadas para el dashboard
  async getEstadisticas() {
    const db = AppDataSource;
    const [total, activos, por_region, top_comunas, por_tipo, por_tipo_institucion, por_rol, por_mes, por_mes_tipo, por_mes_rol] =
      await Promise.all([
        db.query('SELECT COUNT(*)::int AS count FROM users'),
        db.query("SELECT COUNT(*)::int AS count FROM users WHERE is_active = true"),
        db.query('SELECT region, COUNT(*)::int AS count FROM users GROUP BY region ORDER BY count DESC'),
        db.query('SELECT comuna, COUNT(*)::int AS count FROM users GROUP BY comuna ORDER BY count DESC LIMIT 10'),
        db.query('SELECT tipo, COUNT(*)::int AS count FROM users GROUP BY tipo'),
        db.query('SELECT i.tipo_institucion, COUNT(*)::int AS count FROM instituciones i INNER JOIN users u ON u.id = i.user_id GROUP BY i.tipo_institucion'),
        db.query('SELECT rol, COUNT(*)::int AS count FROM users GROUP BY rol ORDER BY count DESC'),
        db.query("SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS mes, COUNT(*)::int AS count FROM users GROUP BY mes ORDER BY mes"),
        db.query("SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS mes, tipo, COUNT(*)::int AS count FROM users GROUP BY mes, tipo ORDER BY mes"),
        db.query("SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS mes, rol, COUNT(*)::int AS count FROM users GROUP BY mes, rol ORDER BY mes"),
      ]);

    return {
      total:               total[0].count,
      activos:             activos[0].count,
      por_region:          por_region,
      top_comunas:         top_comunas,
      por_tipo:            por_tipo,
      por_tipo_institucion: por_tipo_institucion,
      por_rol:             por_rol,
      por_mes:             por_mes,
      por_mes_tipo:        por_mes_tipo,
      por_mes_rol:         por_mes_rol,
    };
  },
};
