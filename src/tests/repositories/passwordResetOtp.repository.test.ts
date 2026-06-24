const repoMethods = {
  create: jest.fn((d) => ({ ...d })),
  save: jest.fn(async (u) => u),
  findOne: jest.fn(),
  delete: jest.fn(async () => undefined),
};

jest.mock('../../config/db', () => ({
  AppDataSource: { getRepository: jest.fn(() => repoMethods) },
}));

import { PasswordResetOtpRepository } from '../../repositories/passwordResetOtp.repository';

describe('PasswordResetOtpRepository', () => {
  beforeEach(() => {
    repoMethods.findOne.mockReset();
    repoMethods.delete.mockClear();
  });

  it('findValid busca por email, code y used=false', async () => {
    repoMethods.findOne.mockResolvedValue({ id: '1' });
    await PasswordResetOtpRepository.findValid('a@b.c', '123456');
    expect(repoMethods.findOne).toHaveBeenCalledWith({
      where: { email: 'a@b.c', code: '123456', used: false },
    });
  });

  it('deleteByEmail y deleteById delegan', async () => {
    await PasswordResetOtpRepository.deleteByEmail('a@b.c');
    await PasswordResetOtpRepository.deleteById('1');
    expect(repoMethods.delete).toHaveBeenCalledWith({ email: 'a@b.c' });
    expect(repoMethods.delete).toHaveBeenCalledWith({ id: '1' });
  });

  it('create y save delegan', async () => {
    PasswordResetOtpRepository.create({ email: 'a@b.c' } as any);
    await PasswordResetOtpRepository.save({ id: '1' } as any);
    expect(repoMethods.create).toHaveBeenCalled();
    expect(repoMethods.save).toHaveBeenCalled();
  });
});
