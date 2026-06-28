// DataSource configurado para la app
import { AppDataSource } from '../config/db';
// Entidad Ciudadano
import { Ciudadano } from '../models/Ciudadano';

// Helper que obtiene el repositorio de TypeORM (lazy para asegurar init)
const repo = () => AppDataSource.getRepository(Ciudadano);

// API de acceso a datos de ciudadanos
export const CiudadanoRepository = {
  // Crea una instancia en memoria (no persiste)
  create(data: Partial<Ciudadano>): Ciudadano {
    return repo().create(data);
  },

  // Persiste la entidad (insert o update)
  async save(ciudadano: Ciudadano): Promise<Ciudadano> {
    return repo().save(ciudadano);
  },

  // Actualiza por id sin cargar la entidad
  async updateById(id: string, data: Partial<Ciudadano>): Promise<void> {
    await repo().update({ id }, data);
  },

  async findByRun(run: string): Promise<Ciudadano | null> {
    return repo().findOne({ where: { run } });
  },
};
