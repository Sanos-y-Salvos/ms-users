import { successResponse, errorResponse } from '../../src/utils/response';

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('response helpers', () => {
  it('successResponse responde con ok=true y data', () => {
    const res = mockRes();
    successResponse(res, { foo: 1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true, data: { foo: 1 } });
  });

  it('successResponse acepta status custom', () => {
    const res = mockRes();
    successResponse(res, { foo: 1 }, 201);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('errorResponse responde con ok=false y message', () => {
    const res = mockRes();
    errorResponse(res, 'boom');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ ok: false, message: 'boom' });
  });

  it('errorResponse acepta status custom', () => {
    const res = mockRes();
    errorResponse(res, 'nope', 404);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
