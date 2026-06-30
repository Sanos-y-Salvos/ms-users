const repoMethods = {
  create: jest.fn((d) => ({ ...d })),
  save: jest.fn(async (u) => u),
  update: jest.fn(async () => undefined),
  findOne: jest.fn(),
};

jest.mock('../../config/db', () => ({
  AppDataSource: { getRepository: jest.fn(() => repoMethods) },
}));

import { InstitucionRepository } from '../../repositories/institucion.repository';

describe('InstitucionRepository', () => {
  it('expone create, save y updateById', async () => {
    InstitucionRepository.create({ nombre_institucion: 'X' } as any);
    await InstitucionRepository.save({ id: '1' } as any);
    await InstitucionRepository.updateById('1', { razon_social: 'Y' });
    expect(repoMethods.create).toHaveBeenCalled();
    expect(repoMethods.save).toHaveBeenCalled();
    expect(repoMethods.update).toHaveBeenCalledWith({ id: '1' }, { razon_social: 'Y' });
  });

  it('findByRut retorna null cuando no existe', async () => {
    repoMethods.findOne.mockResolvedValue(null);
    const result = await InstitucionRepository.findByRut('11111111-1');
    expect(repoMethods.findOne).toHaveBeenCalledWith({ where: { rut: '11111111-1' } });
    expect(result).toBeNull();
  });

  it('findByRut retorna la institución cuando existe', async () => {
    const institucion = { id: 'i1', rut: '11111111-1' };
    repoMethods.findOne.mockResolvedValue(institucion);
    const result = await InstitucionRepository.findByRut('11111111-1');
    expect(result).toBe(institucion);
  });
});
