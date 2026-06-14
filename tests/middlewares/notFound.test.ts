import { notFound } from '../../src/middlewares/notFound';

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('notFound middleware', () => {
  it('responde 404 con mensaje estándar', () => {
    const res = mockRes();
    notFound({} as any, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ ok: false, message: 'Ruta no encontrada' });
  });
});
