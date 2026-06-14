// Tipos de Express
import { Request, Response } from 'express';

// Middleware 404: responde cuando ninguna ruta coincide
export const notFound = (_req: Request, res: Response) => {
  res.status(404).json({ ok: false, message: 'Ruta no encontrada' });
};
