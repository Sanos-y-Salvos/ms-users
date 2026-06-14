import { requireRole } from '../../src/middlewares/requireRole';

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('requireRole middleware', () => {
  it('rechaza con 403 cuando no hay user', () => {
    const res = mockRes();
    const next = jest.fn();
    requireRole('admin')({} as any, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('rechaza con 403 cuando el rol no está permitido', () => {
    const res = mockRes();
    const next = jest.fn();
    requireRole('admin', 'superadmin')(
      { user: { id: '1', email: 'a@b.c', role: 'ciudadano' } } as any,
      res,
      next,
    );
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('continúa cuando el rol está autorizado', () => {
    const res = mockRes();
    const next = jest.fn();
    requireRole('admin', 'superadmin')(
      { user: { id: '1', email: 'a@b.c', role: 'admin' } } as any,
      res,
      next,
    );
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
