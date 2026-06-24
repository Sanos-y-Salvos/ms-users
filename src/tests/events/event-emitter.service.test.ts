const mockPublish = jest.fn();

jest.mock('../../config/rabbitmq', () => ({
  EXCHANGE: 'user.events',
  getChannel: () => ({ publish: mockPublish }),
}));

import {
  emitUserRegistered,
  emitUserUpdated,
  emitUserDeleted,
  emitUserPasswordChanged,
} from '../../events/event-emitter.service';

describe('event-emitter.service', () => {
  beforeEach(() => {
    mockPublish.mockReset();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('emitUserRegistered publica con routing key y payload correcto', async () => {
    await emitUserRegistered({
      userId: '1', email: 'a@b.c', passwordHash: 'h', role: 'ciudadano',
      permissions: [], name: 'A', tipo: 'ciudadano', telefono: '+1',
      region: 'RM', comuna: 'X',
    });
    expect(mockPublish).toHaveBeenCalledWith(
      'user.events',
      'user.registered',
      expect.any(Buffer),
      { persistent: true },
    );
    const payload = JSON.parse(mockPublish.mock.calls[0][2].toString());
    expect(payload).toMatchObject({ event: 'user.registered', userId: '1' });
  });

  it('emitUserUpdated publica correctamente', async () => {
    await emitUserUpdated({ userId: '1', email: 'a@b.c' });
    expect(mockPublish).toHaveBeenCalledWith(
      'user.events', 'user.updated', expect.any(Buffer), { persistent: true },
    );
    const payload = JSON.parse(mockPublish.mock.calls[0][2].toString());
    expect(payload).toMatchObject({ event: 'user.updated' });
  });

  it('emitUserDeleted publica con userId', async () => {
    await emitUserDeleted('1');
    const payload = JSON.parse(mockPublish.mock.calls[0][2].toString());
    expect(payload).toMatchObject({ event: 'user.deleted', userId: '1' });
  });

  it('emitUserPasswordChanged publica con hash', async () => {
    await emitUserPasswordChanged('1', 'h');
    const payload = JSON.parse(mockPublish.mock.calls[0][2].toString());
    expect(payload).toMatchObject({ event: 'user.password.changed', passwordHash: 'h' });
  });

  it('no relanza si el canal falla (loguea error)', async () => {
    mockPublish.mockImplementation(() => { throw new Error('rabbitmq down'); });
    await expect(emitUserDeleted('1')).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });
});
