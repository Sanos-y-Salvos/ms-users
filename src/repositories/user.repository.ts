import { FindOptionsWhere } from 'typeorm';
import { AppDataSource } from '../config/db';
import { User } from '../models/User';

const repo = () => AppDataSource.getRepository(User);

export const UserRepository = {
  create(data: Partial<User>): User {
    return repo().create(data);
  },

  async save(user: User): Promise<User> {
    return repo().save(user);
  },

  async findByCredentialId(
    credentialId: string,
    opts: { activeOnly?: boolean; withRelations?: boolean } = {},
  ): Promise<User | null> {
    const where: FindOptionsWhere<User> = { credential_id: credentialId };
    if (opts.activeOnly) where.is_active = true;
    return repo().findOne({
      where,
      relations: opts.withRelations ? ['ciudadano', 'institucion'] : undefined,
    });
  },

  async findById(
    id: string,
    opts: { withRelations?: boolean } = {},
  ): Promise<User | null> {
    return repo().findOne({
      where: { id },
      relations: opts.withRelations ? ['ciudadano', 'institucion'] : undefined,
    });
  },

  async findByEmail(
    email: string,
    opts: { activeOnly?: boolean } = {},
  ): Promise<User | null> {
    const where: FindOptionsWhere<User> = { email };
    if (opts.activeOnly) where.is_active = true;
    return repo().findOne({ where });
  },

  async findAll(where: FindOptionsWhere<User>): Promise<User[]> {
    return repo().find({
      where,
      relations: ['ciudadano', 'institucion'],
      order: { created_at: 'DESC' },
    });
  },

  async updateByCredentialId(credentialId: string, data: Partial<User>): Promise<void> {
    await repo().update({ credential_id: credentialId }, data);
  },

  async updateById(id: string, data: Partial<User>): Promise<void> {
    await repo().update({ id }, data);
  },

  async updateByEmail(email: string, data: Partial<User>): Promise<void> {
    await repo().update({ email }, data);
  },
};
