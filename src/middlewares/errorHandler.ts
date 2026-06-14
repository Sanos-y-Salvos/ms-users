// Tipos de Express para middlewares
import { Request, Response, NextFunction } from 'express';

// Middleware final que captura errores no manejados en la cadena
export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // Loguea el stack para diagnóstico
  console.error(err.stack);
  // Responde con error genérico 500 al cliente
  res.status(500).json({ ok: false, message: 'Error interno del servidor' });
};
