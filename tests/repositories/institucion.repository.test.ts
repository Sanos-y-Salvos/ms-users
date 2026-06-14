const repoMethods = {
  create: jest.fn((d) => ({ ...d })),
  save: jest.fn(async (u) => u),
  update: jest.fn(async () => undefined),
};

jest.mock('../../src/config/db', () => ({
  AppDataSource: { getRepository: jest.fn(() => repoMethods) },
}));

import { InstitucionRepository } from '../../src/repositories/institucion.repository';

describe('InstitucionRepository', () => {
  it('expone create, save y updateById', async () => {
    InstitucionRepository.create({ nombre_institucion: 'X' } as any);
    await InstitucionRepository.save({ id: '1' } as any);
    await InstitucionRepository.updateById('1', { razon_social: 'Y' });
    expect(repoMethods.create).toHaveBeenCalled();
    expect(repoMethods.save).toHaveBeenCalled();
    expect(repoMethods.update).toHaveBeenCalledWith({ id: '1' }, { razon_social: 'Y' });
  });
});
