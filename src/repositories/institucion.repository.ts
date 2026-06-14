// DataSource configurado
import { AppDataSource } from '../config/db';
// Entidad Institucion
import { Institucion } from '../models/Institucion';

// Helper lazy para obtener el repositorio
const repo = () => AppDataSource.getRepository(Institucion);

// API de acceso a datos de instituciones
export const InstitucionRepository = {
  // Crea una instancia en memoria
  create(data: Partial<Institucion>): Institucion {
    return repo().create(data);
  },

  // Persiste la entidad
  async save(institucion: Institucion): Promise<Institucion> {
    return repo().save(institucion);
  },

  // Update parcial por id
  async updateById(id: string, data: Partial<Institucion>): Promise<void> {
    await repo().update({ id }, data);
  },
};
