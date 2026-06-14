// Tipos de Express
import { Request, Response, NextFunction } from 'express';
// Librería para verificar JWT
import jwt from 'jsonwebtoken';

// Extiende Request para exponer el usuario autenticado
export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

// Middleware que valida el JWT del header Authorization
export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // Extrae el header Authorization
  const authHeader = req.headers['authorization'];
  // Obtiene el token después de "Bearer "
  const token = authHeader && authHeader.split(' ')[1];

  // Si no llega token, rechaza con 401
  if (!token) {
    res.status(401).json({ ok: false, message: 'Token requerido' });
    return;
  }

  try {
    // Verifica firma y decodifica el payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string; email: string; role: string;
    };
    // Adjunta el usuario decodificado al request
    req.user = decoded;
    // Continúa la cadena
    next();
  } catch {
    // Token inválido o expirado: 401
    res.status(401).json({ ok: false, message: 'Token inválido o expirado' });
  }
};
