// Tipo para condiciones tipadas de búsqueda
import { FindOptionsWhere } from 'typeorm';
// DataSource configurado
import { AppDataSource } from '../config/db';
// Entidad User
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
};
