jest.mock('../../src/events/event-emitter.service', () => ({
  emitUserRegistered: jest.fn(async () => undefined),
  emitUserUpdated: jest.fn(async () => undefined),
  emitUserDeleted: jest.fn(async () => undefined),
  emitUserPasswordChanged: jest.fn(async () => undefined),
}));
jest.mock('../../src/repositories/user.repository', () => ({
  UserRepository: {
    findByCredentialId: jest.fn(),
    findByEmail: jest.fn(),
    updateByCredentialId: jest.fn(),
    updateByEmail: jest.fn(),
  },
}));
jest.mock('../../src/repositories/passwordResetOtp.repository', () => ({
  PasswordResetOtpRepository: {
    deleteByEmail: jest.fn(),
    create: jest.fn((data) => ({ ...data, id: 'otp-1' })),
    save: jest.fn(async (x) => x),
    findValid: jest.fn(),
    deleteById: jest.fn(),
  },
}));
jest.mock('../../src/utils/mailer', () => ({
  sendOtpEmail: jest.fn(async () => undefined),
}));
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(async () => 'new-hash'),
}));

import bcrypt from 'bcrypt';
import { UserRepository } from '../../src/repositories/user.repository';
import { PasswordResetOtpRepository } from '../../src/repositories/passwordResetOtp.repository';
import { sendOtpEmail } from '../../src/utils/mailer';
import * as PasswordService from '../../src/services/password.service';

describe('changePassword', () => {
  beforeEach(() => jest.clearAllMocks());

  it('cambia la contraseña cuando la actual es válida', async () => {
    (UserRepository.findByCredentialId as jest.Mock).mockResolvedValue({ password_hash: 'old' });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    const res = await PasswordService.changePassword('cred-1', 'current', 'new12345');
    expect(res.message).toMatch(/actualizada/);
    expect(UserRepository.updateByCredentialId).toHaveBeenCalledWith('cred-1', { password_hash: 'new-hash' });
  });

  it('falla si el usuario no existe', async () => {
    (UserRepository.findByCredentialId as jest.Mock).mockResolvedValue(null);
    await expect(PasswordService.changePassword('x', 'a', 'b')).rejects.toThrow('Usuario no encontrado');
  });

  it('falla si la contraseña actual no coincide', async () => {
    (UserRepository.findByCredentialId as jest.Mock).mockResolvedValue({ password_hash: 'old' });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(PasswordService.changePassword('x', 'bad', 'new')).rejects.toThrow(
      'La contraseña actual es incorrecta',
    );
  });
});

describe('forgotPassword', () => {
  beforeEach(() => jest.clearAllMocks());

  it('genera OTP y envía mail si el usuario existe', async () => {
    (UserRepository.findByEmail as jest.Mock).mockResolvedValue({ email: 'a@b.c' });
    const res = await PasswordService.forgotPassword('A@b.c');
    expect(res.message).toMatch(/código/);
    expect(PasswordResetOtpRepository.deleteByEmail).toHaveBeenCalledWith('a@b.c');
    expect(PasswordResetOtpRepository.save).toHaveBeenCalled();
    expect(sendOtpEmail).toHaveBeenCalled();
  });

  it('responde genérico cuando el usuario no existe (no envía mail)', async () => {
    (UserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
    const res = await PasswordService.forgotPassword('nope@nope.cl');
    expect(res.message).toMatch(/código/);
    expect(sendOtpEmail).not.toHaveBeenCalled();
  });
});

describe('resetPassword', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rechaza OTP inexistente', async () => {
    (PasswordResetOtpRepository.findValid as jest.Mock).mockResolvedValue(null);
    await expect(PasswordService.resetPassword('a@b.c', '000000', 'newpass')).rejects.toThrow(
      'Código inválido',
    );
  });

  it('rechaza OTP expirado y lo elimina', async () => {
    (PasswordResetOtpRepository.findValid as jest.Mock).mockResolvedValue({
      id: 'otp-1', expires_at: new Date(Date.now() - 1000),
    });
    await expect(PasswordService.resetPassword('a@b.c', '123456', 'newpass')).rejects.toThrow('Código expirado');
    expect(PasswordResetOtpRepository.deleteById).toHaveBeenCalledWith('otp-1');
  });

  it('actualiza la contraseña con OTP válido', async () => {
    (PasswordResetOtpRepository.findValid as jest.Mock).mockResolvedValue({
      id: 'otp-1', expires_at: new Date(Date.now() + 60_000),
    });
    (UserRepository.findByEmail as jest.Mock).mockResolvedValue({ email: 'a@b.c' });
    const res = await PasswordService.resetPassword('A@b.c', '123456', 'newpass');
    expect(res.message).toMatch(/actualizada/);
    expect(UserRepository.updateByEmail).toHaveBeenCalledWith('a@b.c', { password_hash: 'new-hash' });
  });

  it('falla si el usuario fue desactivado entre el OTP y el reset', async () => {
    (PasswordResetOtpRepository.findValid as jest.Mock).mockResolvedValue({
      id: 'otp-1', expires_at: new Date(Date.now() + 60_000),
    });
    (UserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
    await expect(PasswordService.resetPassword('a@b.c', '123456', 'newpass')).rejects.toThrow(
      'Usuario no encontrado',
    );
  });
});
