import { AppDataSource } from '../config/db';
import { Institucion } from '../models/Institucion';

const repo = () => AppDataSource.getRepository(Institucion);

export const InstitucionRepository = {
  create(data: Partial<Institucion>): Institucion {
    return repo().create(data);
  },

  async save(institucion: Institucion): Promise<Institucion> {
    return repo().save(institucion);
  },

  async updateById(id: string, data: Partial<Institucion>): Promise<void> {
    await repo().update({ id }, data);
  },
};
