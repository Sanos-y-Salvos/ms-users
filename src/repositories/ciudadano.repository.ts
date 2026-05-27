import { AppDataSource } from '../config/db';
import { Ciudadano } from '../models/Ciudadano';

const repo = () => AppDataSource.getRepository(Ciudadano);

export const CiudadanoRepository = {
  create(data: Partial<Ciudadano>): Ciudadano {
    return repo().create(data);
  },

  async save(ciudadano: Ciudadano): Promise<Ciudadano> {
    return repo().save(ciudadano);
  },

  async updateById(id: string, data: Partial<Ciudadano>): Promise<void> {
    await repo().update({ id }, data);
  },
};
