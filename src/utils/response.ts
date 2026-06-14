// Tipo Response de Express
import { Response } from 'express';

// Respuesta estándar de éxito con payload y status opcional
export const successResponse = (res: Response, data: object, status = 200) => {
  return res.status(status).json({ ok: true, data });
};

// Respuesta estándar de error con mensaje y status opcional
export const errorResponse = (res: Response, message: string, status = 400) => {
  return res.status(status).json({ ok: false, message });
};
