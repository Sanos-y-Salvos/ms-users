jest.mock('../../src/config/redis', () => ({
  userEventsQueue: { add: jest.fn() },
}));

import {
  emitUserRegistered,
  emitUserUpdated,
  emitUserDeleted,
  emitUserPasswordChanged,
} from '../../src/events/event-emitter.service';
import { userEventsQueue } from '../../src/config/redis';

describe('event-emitter.service', () => {
  beforeEach(() => {
    (userEventsQueue.add as jest.Mock).mockReset();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('emitUserRegistered encola con tipo y timestamp', async () => {
    (userEventsQueue.add as jest.Mock).mockResolvedValue({});
    await emitUserRegistered({
      userId: '1', email: 'a@b.c', passwordHash: 'h', role: 'ciudadano',
      permissions: [], name: 'A', tipo: 'ciudadano', telefono: '+1',
      region: 'RM', comuna: 'X',
    });
    expect(userEventsQueue.add).toHaveBeenCalledWith(
      'user.registered',
      expect.objectContaining({ event: 'user.registered', userId: '1' }),
    );
  });

  it('emitUserUpdated encola correctamente', async () => {
    (userEventsQueue.add as jest.Mock).mockResolvedValue({});
    await emitUserUpdated({ userId: '1', email: 'a@b.c' });
    expect(userEventsQueue.add).toHaveBeenCalledWith(
      'user.updated',
      expect.objectContaining({ event: 'user.updated' }),
    );
  });

  it('emitUserDeleted encola con userId', async () => {
    (userEventsQueue.add as jest.Mock).mockResolvedValue({});
    await emitUserDeleted('1');
    expect(userEventsQueue.add).toHaveBeenCalledWith(
      'user.deleted',
      expect.objectContaining({ event: 'user.deleted', userId: '1' }),
    );
  });

  it('emitUserPasswordChanged encola con hash', async () => {
    (userEventsQueue.add as jest.Mock).mockResolvedValue({});
    await emitUserPasswordChanged('1', 'h');
    expect(userEventsQueue.add).toHaveBeenCalledWith(
      'user.password.changed',
      expect.objectContaining({ event: 'user.password.changed', passwordHash: 'h' }),
    );
  });

  it('no relanza si la cola falla (loguea)', async () => {
    (userEventsQueue.add as jest.Mock).mockRejectedValue(new Error('redis down'));
    await expect(emitUserDeleted('1')).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });
});
