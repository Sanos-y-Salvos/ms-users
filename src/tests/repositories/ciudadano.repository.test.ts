const repoMethods = {
  create: jest.fn((d) => ({ ...d })),
  save: jest.fn(async (u) => u),
  update: jest.fn(async () => undefined),
  findOne: jest.fn(),
};

jest.mock('../../config/db', () => ({
  AppDataSource: { getRepository: jest.fn(() => repoMethods) },
}));

import { CiudadanoRepository } from '../../repositories/ciudadano.repository';

describe('CiudadanoRepository', () => {
  it('create, save y updateById delegan al repo TypeORM', async () => {
    CiudadanoRepository.create({ primer_nombre: 'A' } as any);
    await CiudadanoRepository.save({ id: '1' } as any);
    await CiudadanoRepository.updateById('1', { direccion: 'X' });
    expect(repoMethods.create).toHaveBeenCalled();
    expect(repoMethods.save).toHaveBeenCalled();
    expect(repoMethods.update).toHaveBeenCalledWith({ id: '1' }, { direccion: 'X' });
  });

  it('findByRun busca por RUN y retorna null cuando no existe', async () => {
    repoMethods.findOne.mockResolvedValue(null);
    const result = await CiudadanoRepository.findByRun('11111111-1');
    expect(repoMethods.findOne).toHaveBeenCalledWith({ where: { run: '11111111-1' } });
    expect(result).toBeNull();
  });

  it('findByRun retorna el ciudadano cuando existe', async () => {
    const ciudadano = { id: 'c1', run: '11111111-1' };
    repoMethods.findOne.mockResolvedValue(ciudadano);
    const result = await CiudadanoRepository.findByRun('11111111-1');
    expect(result).toBe(ciudadano);
  });
});
