jest.mock('../../services/password.service', () => ({
  changePassword: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
}));

import * as PasswordService from '../../services/password.service';
import { changePassword, forgotPassword, resetPassword } from '../../controllers/password.controller';

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('changePassword controller', () => {
  beforeEach(() => jest.clearAllMocks());

  it('400 si faltan campos', async () => {
    const res = mockRes();
    await changePassword({ body: {}, user: { id: 'u1' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('400 si la nueva es muy corta', async () => {
    const res = mockRes();
    await changePassword(
      { body: { currentPassword: 'a', newPassword: '12' }, user: { id: 'u1' } } as any,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('200 cuando el servicio retorna ok', async () => {
    (PasswordService.changePassword as jest.Mock).mockResolvedValue({ message: 'ok' });
    const res = mockRes();
    await changePassword(
      { body: { currentPassword: 'a', newPassword: '123456' }, user: { id: 'u1' } } as any,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('propaga el status del error', async () => {
    (PasswordService.changePassword as jest.Mock).mockRejectedValue(
      Object.assign(new Error('no'), { status: 404 }),
    );
    const res = mockRes();
    await changePassword(
      { body: { currentPassword: 'a', newPassword: '123456' }, user: { id: 'u1' } } as any,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('usa 400 por defecto cuando el error no tiene status', async () => {
    (PasswordService.changePassword as jest.Mock).mockRejectedValue(new Error('fallo'));
    const res = mockRes();
    await changePassword(
      { body: { currentPassword: 'a', newPassword: '123456' }, user: { id: 'u1' } } as any,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('forgotPassword controller', () => {
  it('400 si falta email', async () => {
    const res = mockRes();
    await forgotPassword({ body: {} } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('200 cuando el servicio retorna ok', async () => {
    (PasswordService.forgotPassword as jest.Mock).mockResolvedValue({ message: 'ok' });
    const res = mockRes();
    await forgotPassword({ body: { email: 'a@b.c' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('propaga el status del error del servicio', async () => {
    (PasswordService.forgotPassword as jest.Mock).mockRejectedValue(
      Object.assign(new Error('no encontrado'), { status: 404 }),
    );
    const res = mockRes();
    await forgotPassword({ body: { email: 'a@b.c' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('usa 400 por defecto cuando el error no tiene status', async () => {
    (PasswordService.forgotPassword as jest.Mock).mockRejectedValue(new Error('fallo'));
    const res = mockRes();
    await forgotPassword({ body: { email: 'a@b.c' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('resetPassword controller', () => {
  it('400 si faltan campos', async () => {
    const res = mockRes();
    await resetPassword({ body: {} } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('400 si la nueva es muy corta', async () => {
    const res = mockRes();
    await resetPassword({ body: { email: 'a@b.c', code: '1', newPassword: '12' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('200 cuando el servicio retorna ok', async () => {
    (PasswordService.resetPassword as jest.Mock).mockResolvedValue({ message: 'ok' });
    const res = mockRes();
    await resetPassword({ body: { email: 'a@b.c', code: '123456', newPassword: 'abcdef' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('propaga el status del error del servicio', async () => {
    (PasswordService.resetPassword as jest.Mock).mockRejectedValue(
      Object.assign(new Error('OTP inválido'), { status: 422 }),
    );
    const res = mockRes();
    await resetPassword({ body: { email: 'a@b.c', code: '000000', newPassword: 'abcdef' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('usa 400 por defecto cuando el error no tiene status', async () => {
    (PasswordService.resetPassword as jest.Mock).mockRejectedValue(new Error('fallo'));
    const res = mockRes();
    await resetPassword({ body: { email: 'a@b.c', code: '000000', newPassword: 'abcdef' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
