// Bull: cola de trabajos basada en Redis
import Bull from 'bull';

// URL del broker Redis (con fallback local)
const REDIS_BROKER_URL = process.env.REDIS_BROKER_URL || 'redis://localhost:6379';

// Opciones por defecto para todos los jobs encolados
const defaultJobOptions: Bull.JobOptions = {
  // Hasta 5 reintentos en caso de fallo
  attempts: 5,
  // Backoff exponencial empezando en 2s
  backoff: { type: 'exponential', delay: 2000 },
  // Elimina automáticamente los jobs completados
  removeOnComplete: true,
  // Conserva los jobs fallidos para inspección
  removeOnFail: false,
};

// Cola para eventos de dominio relacionados a usuarios
export const userEventsQueue = new Bull('user-events', REDIS_BROKER_URL, {
  defaultJobOptions,
});

// Listener para errores de la cola (no detiene la app)
userEventsQueue.on('error', (err) => {
  console.error('[redis] Error en queue user-events:', err.message);
});
