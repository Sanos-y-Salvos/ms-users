import jwt from 'jsonwebtoken';
import { verifyToken } from '../../src/middlewares/verifyToken';

jest.mock('jsonwebtoken');

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('verifyToken middleware', () => {
  const ORIGINAL_SECRET = process.env.JWT_SECRET;
  beforeAll(() => { process.env.JWT_SECRET = 'test-secret'; });
  afterAll(() => { process.env.JWT_SECRET = ORIGINAL_SECRET; });

  it('rechaza con 401 si no hay header', () => {
    const res = mockRes();
    const next = jest.fn();
    verifyToken({ headers: {} } as any, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rechaza con 401 si el token es inválido', () => {
    (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('bad'); });
    const res = mockRes();
    const next = jest.fn();
    verifyToken(
      { headers: { authorization: 'Bearer xyz' } } as any,
      res,
      next,
    );
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('decodifica el token y adjunta user al request', () => {
    const decoded = { id: '1', email: 'a@b.c', role: 'admin' };
    (jwt.verify as jest.Mock).mockReturnValue(decoded);
    const req: any = { headers: { authorization: 'Bearer good' } };
    const res = mockRes();
    const next = jest.fn();
    verifyToken(req, res, next);
    expect(req.user).toEqual(decoded);
    expect(next).toHaveBeenCalled();
  });
});
