// Mock del DataSource antes de importar el repo
const repoMethods = {
  create: jest.fn((d) => ({ ...d })),
  save: jest.fn(async (u) => u),
  findOne: jest.fn(),
  find: jest.fn(),
  update: jest.fn(async () => undefined),
};

const mockQuery = jest.fn();

jest.mock('../../config/db', () => ({
  AppDataSource: { getRepository: jest.fn(() => repoMethods), query: (...args: any[]) => mockQuery(...args) },
}));

import { UserRepository } from '../../repositories/user.repository';

describe('UserRepository', () => {
  beforeEach(() => {
    repoMethods.create.mockClear();
    repoMethods.save.mockClear();
    repoMethods.findOne.mockClear();
    repoMethods.find.mockClear();
    repoMethods.update.mockClear();
    mockQuery.mockClear();
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

  it('findById sin withRelations usa relations: undefined', async () => {
    await UserRepository.findById('1');
    expect(repoMethods.findOne).toHaveBeenCalledWith({
      where: { id: '1' },
      relations: undefined,
    });
  });

  it('findByEmail con activeOnly', async () => {
    await UserRepository.findByEmail('a@b.c', { activeOnly: true });
    expect(repoMethods.findOne).toHaveBeenCalledWith({
      where: { email: 'a@b.c', is_active: true },
    });
  });

  it('findByEmail sin activeOnly no agrega is_active', async () => {
    await UserRepository.findByEmail('a@b.c');
    expect(repoMethods.findOne).toHaveBeenCalledWith({
      where: { email: 'a@b.c' },
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

  it('getEstadisticas ejecuta todas las queries y retorna el objeto agregado', async () => {
    mockQuery
      .mockResolvedValueOnce([{ count: 5 }])     // total
      .mockResolvedValueOnce([{ count: 3 }])     // activos
      .mockResolvedValueOnce([])                  // por_region
      .mockResolvedValueOnce([])                  // top_comunas
      .mockResolvedValueOnce([])                  // por_tipo
      .mockResolvedValueOnce([])                  // por_tipo_institucion
      .mockResolvedValueOnce([])                  // por_rol
      .mockResolvedValueOnce([])                  // por_mes
      .mockResolvedValueOnce([])                  // por_mes_tipo
      .mockResolvedValueOnce([]);                 // por_mes_rol

    const result = await UserRepository.getEstadisticas();
    expect(result.total).toBe(5);
    expect(result.activos).toBe(3);
    expect(mockQuery).toHaveBeenCalledTimes(10);
  });
});
