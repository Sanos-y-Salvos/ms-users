import { getChannel } from '../config/rabbitmq';
import { EXCHANGE } from '../config/rabbitmq';

export interface UserRegisteredPayload {
  event: 'user.registered';
  userId: string;
  email: string;
  passwordHash: string;
  role: string;
  permissions: string[];
  name: string;
  avatarUrl?: string;
  foto_perfil?: string;
  tipo: 'ciudadano' | 'institucion';
  telefono: string;
  region: string;
  comuna: string;
  primer_nombre?: string;
  segundo_nombre?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  run?: string;
  direccion?: string;
  razon_social?: string;
  rut?: string;
  tipo_institucion?: string;
  timestamp: Date;
}

export interface UserUpdatedPayload {
  event: 'user.updated';
  userId: string;
  email?: string;
  role?: string;
  permissions?: string[];
  name?: string;
  avatarUrl?: string;
  status?: 'active' | 'inactive';
  telefono?: string;
  region?: string;
  comuna?: string;
  primer_nombre?: string;
  segundo_nombre?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  direccion?: string;
  razon_social?: string;
  timestamp?: Date;
}

export interface UserDeletedPayload {
  event: 'user.deleted';
  userId: string;
  timestamp: Date;
}

export interface UserPasswordChangedPayload {
  event: 'user.password.changed';
  userId: string;
  passwordHash: string;
  timestamp: Date;
}

function publish(routingKey: string, payload: object): void {
  try {
    getChannel().publish(
      EXCHANGE,
      routingKey,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true },
    );
    console.log(`[event-emitter] ${routingKey} publicado`);
  } catch (err: any) {
    // No relanza: la escritura local ya fue exitosa
    console.error(`[event-emitter] Error publicando ${routingKey}: ${err.message}`);
  }
}

export const emitUserRegistered = async (
  data: Omit<UserRegisteredPayload, 'event' | 'timestamp'>,
): Promise<void> => {
  publish('user.registered', { ...data, event: 'user.registered', timestamp: new Date() });
};

export const emitUserUpdated = async (
  data: Omit<UserUpdatedPayload, 'event' | 'timestamp'>,
): Promise<void> => {
  publish('user.updated', { ...data, event: 'user.updated', timestamp: new Date() });
};

export const emitUserDeleted = async (userId: string): Promise<void> => {
  publish('user.deleted', { userId, event: 'user.deleted', timestamp: new Date() });
};

export const emitUserPasswordChanged = async (
  userId: string,
  passwordHash: string,
): Promise<void> => {
  publish('user.password.changed', {
    userId,
    passwordHash,
    event: 'user.password.changed',
    timestamp: new Date(),
  });
};
