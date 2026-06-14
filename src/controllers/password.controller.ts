// Tipos Request/Response de Express
import { Request, Response } from 'express';
// Servicio que implementa la lógica de contraseñas
import * as PasswordService from '../services/password.service';
// Helpers de respuesta estándar
import { successResponse, errorResponse } from '../utils/response';
// Request extendido con usuario autenticado
import { AuthRequest } from '../middlewares/verifyToken';

// PATCH /perfil/password — Cambia la contraseña del usuario autenticado
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Toma contraseña actual y nueva del body
    const { currentPassword, newPassword } = req.body;
    // Valida que ambas estén presentes
    if (!currentPassword || !newPassword) {
      errorResponse(res, 'Contraseña actual y nueva contraseña requeridas');
      return;
    }
    // Largo mínimo de la nueva contraseña
    if (newPassword.length < 6) {
      errorResponse(res, 'La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    // Delega al servicio usando el id del usuario autenticado
    const data = await PasswordService.changePassword(req.user!.id, currentPassword, newPassword);
    successResponse(res, data);
  } catch (err: any) {
    // Responde con el status incluido en el error o 400 por defecto
    errorResponse(res, err.message, err.status ?? 400);
  }
};

// POST /forgot-password — Inicia el flujo de recuperación enviando un OTP
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    // Email del usuario que solicita el OTP
    const { email } = req.body;
    if (!email) {
      errorResponse(res, 'Email requerido');
      return;
    }
    // Delega al servicio (respuesta genérica por seguridad)
    const data = await PasswordService.forgotPassword(email);
    successResponse(res, data);
  } catch (err: any) {
    errorResponse(res, err.message, err.status ?? 400);
  }
};

// PATCH /reset-password — Valida el OTP y aplica el cambio de contraseña
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    // Email, código OTP y nueva contraseña
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      errorResponse(res, 'Email, código y nueva contraseña requeridos');
      return;
    }
    // Largo mínimo
    if (newPassword.length < 6) {
      errorResponse(res, 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    // Delega al servicio
    const data = await PasswordService.resetPassword(email, code, newPassword);
    successResponse(res, data);
  } catch (err: any) {
    errorResponse(res, err.message, err.status ?? 400);
  }
};
