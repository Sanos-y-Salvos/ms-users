// Mock del DataSource antes de importar el repo
const repoMethods = {
  create: jest.fn((d) => ({ ...d })),
  save: jest.fn(async (u) => u),
  findOne: jest.fn(),
  find: jest.fn(),
  update: jest.fn(async () => undefined),
};

jest.mock('../../src/config/db', () => ({
  AppDataSource: { getRepository: jest.fn(() => repoMethods) },
}));

import { UserRepository } from '../../src/repositories/user.repository';

describe('UserRepository', () => {
  beforeEach(() => {
    repoMethods.create.mockClear();
    repoMethods.save.mockClear();
    repoMethods.findOne.mockClear();
    repoMethods.find.mockClear();
    repoMethods.update.mockClear();
  });

  it('create delega a getRepository().create', () => {
    UserRepository.create({ email: 'a@b.c' } as any);
    expect(repoMethods.create).toHaveBeenCalledWith({ email: 'a@b.c' });
  });

  it('save delega a getRepository().save', async () => {
    await UserRepository.save({ id: '1' } as any);
    expect(repoMethods.save).toHaveBeenCalled();
  });

  it('findByCredentialId con activeOnly y withRelations construye el where y relations', async () => {
    repoMethods.findOne.mockResolvedValue({ id: '1' });
    await UserRepository.findByCredentialId('cred', { activeOnly: true, withRelations: true });
    expect(repoMethods.findOne).toHaveBeenCalledWith({
      where: { credential_id: 'cred', is_active: true },
      relations: ['ciudadano', 'institucion'],
    });
  });

  it('findByCredentialId sin opts no agrega is_active ni relations', async () => {
    repoMethods.findOne.mockResolvedValue(null);
    await UserRepository.findByCredentialId('cred');
    expect(repoMethods.findOne).toHaveBeenCalledWith({
      where: { credential_id: 'cred' },
      relations: undefined,
    });
  });

  it('findById con withRelations', async () => {
    await UserRepository.findById('1', { withRelations: true });
    expect(repoMethods.findOne).toHaveBeenCalledWith({
      where: { id: '1' },
      relations: ['ciudadano', 'institucion'],
    });
  });

  it('findByEmail con activeOnly', async () => {
    await UserRepository.findByEmail('a@b.c', { activeOnly: true });
    expect(repoMethods.findOne).toHaveBeenCalledWith({
      where: { email: 'a@b.c', is_active: true },
    });
  });

  it('findAll usa relations y order DESC', async () => {
    repoMethods.find.mockResolvedValue([]);
    await UserRepository.findAll({});
    expect(repoMethods.find).toHaveBeenCalledWith({
      where: {},
      relations: ['ciudadano', 'institucion'],
      order: { created_at: 'DESC' },
    });
  });

  it('updateByCredentialId delega', async () => {
    await UserRepository.updateByCredentialId('cred', { telefono: 'x' });
    expect(repoMethods.update).toHaveBeenCalledWith({ credential_id: 'cred' }, { telefono: 'x' });
  });

  it('updateById delega', async () => {
    await UserRepository.updateById('1', { telefono: 'x' });
    expect(repoMethods.update).toHaveBeenCalledWith({ id: '1' }, { telefono: 'x' });
  });

  it('updateByEmail delega', async () => {
    await UserRepository.updateByEmail('a@b.c', { password_hash: 'h' });
    expect(repoMethods.update).toHaveBeenCalledWith({ email: 'a@b.c' }, { password_hash: 'h' });
  });
});
