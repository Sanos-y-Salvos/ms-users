const userRepoMethods = {
  findOne: jest.fn(),
  create: jest.fn((d: any) => ({ ...d })),
  save: jest.fn(async (u: any) => u),
};

const ciudadanoRepoMethods = {
  create: jest.fn((d: any) => ({ ...d })),
  save: jest.fn(async (u: any) => u),
};

jest.mock('../../config/db', () => ({
  AppDataSource: {
    getRepository: jest.fn((entity: any) => {
      if (entity?.name === 'Ciudadano' || String(entity).includes('Ciudadano')) return ciudadanoRepoMethods;
      return userRepoMethods;
    }),
  },
}));

jest.mock('bcrypt', () => ({ hash: jest.fn(async () => 'hashed') }));
jest.mock('uuid', () => ({ v4: jest.fn(() => 'uuid-fixed') }));

import { AppDataSource } from '../../config/db';
import { seedAdminUser } from '../../seed/adminSeed';

describe('seedAdminUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity: any) => {
      const name = typeof entity === 'function' ? entity.name : String(entity);
      if (name === 'Ciudadano') return ciudadanoRepoMethods;
      return userRepoMethods;
    });
  });

  it('no crea usuario si ya existe', async () => {
    userRepoMethods.findOne.mockResolvedValue({ id: 'existing' });
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await seedAdminUser();
    expect(userRepoMethods.create).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('crea usuario y ciudadano si no existe', async () => {
    userRepoMethods.findOne.mockResolvedValue(null);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await seedAdminUser();
    expect(userRepoMethods.create).toHaveBeenCalled();
    expect(userRepoMethods.save).toHaveBeenCalled();
    expect(ciudadanoRepoMethods.create).toHaveBeenCalled();
    expect(ciudadanoRepoMethods.save).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
