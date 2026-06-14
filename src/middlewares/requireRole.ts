// Tipos de Express usados en middlewares
import { Response, NextFunction } from 'express';
// Request extendido con el usuario autenticado
import { AuthRequest } from './verifyToken';

// Middleware factory: restringe acceso a una lista de roles permitidos
export const requireRole = (...roles: string[]) => {
  // Middleware real que valida el rol presente en req.user
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // Si no hay usuario o su rol no está autorizado, rechaza con 403
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ ok: false, message: 'No tienes permisos para realizar esta acción' });
      return;
    }
    // Rol válido: continúa al siguiente middleware/handler
    next();
  };
};
