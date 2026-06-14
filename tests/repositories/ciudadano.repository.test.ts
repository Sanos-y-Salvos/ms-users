const repoMethods = {
  create: jest.fn((d) => ({ ...d })),
  save: jest.fn(async (u) => u),
  update: jest.fn(async () => undefined),
};

jest.mock('../../src/config/db', () => ({
  AppDataSource: { getRepository: jest.fn(() => repoMethods) },
}));

import { CiudadanoRepository } from '../../src/repositories/ciudadano.repository';

describe('CiudadanoRepository', () => {
  it('create, save y updateById delegan al repo TypeORM', async () => {
    CiudadanoRepository.create({ primer_nombre: 'A' } as any);
    await CiudadanoRepository.save({ id: '1' } as any);
    await CiudadanoRepository.updateById('1', { direccion: 'X' });
    expect(repoMethods.create).toHaveBeenCalled();
    expect(repoMethods.save).toHaveBeenCalled();
    expect(repoMethods.update).toHaveBeenCalledWith({ id: '1' }, { direccion: 'X' });
  });
});
