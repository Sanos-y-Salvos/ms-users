// Hashing y comparación de contraseñas
import bcrypt from 'bcrypt';
// Repositorios necesarios
import { UserRepository } from '../repositories/user.repository';
import { PasswordResetOtpRepository } from '../repositories/passwordResetOtp.repository';
// Envío de correos OTP
import { sendOtpEmail } from '../utils/mailer';

// Tiempo de vida del OTP: 10 minutos en milisegundos
const OTP_TTL_MS = 10 * 60 * 1000;

// Genera un código OTP numérico de 6 dígitos
function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Cambia la contraseña del usuario autenticado tras verificar la actual
export const changePassword = async (
  credentialId: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ message: string }> => {
  // Busca el usuario activo asociado al credential_id
  const user = await UserRepository.findByCredentialId(credentialId, { activeOnly: true });
  if (!user) throw new Error('Usuario no encontrado');

  // Verifica que la contraseña actual coincida con el hash almacenado
  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw Object.assign(new Error('La contraseña actual es incorrecta'), { status: 400 });

  // Hashea y persiste la nueva contraseña
  const password_hash = await bcrypt.hash(newPassword, 10);
  await UserRepository.updateByCredentialId(credentialId, { password_hash });

  // Mensaje de confirmación al cliente
  return { message: 'Contraseña actualizada correctamente' };
};

// Paso 1 del flujo de recuperación: genera OTP y lo envía (respuesta genérica por seguridad)
export const forgotPassword = async (email: string): Promise<{ message: string }> => {
  // Normaliza el email a minúsculas
  email = email.toLowerCase();
  // Busca usuario activo (si no existe, no se hace nada pero se responde igual)
  const user = await UserRepository.findByEmail(email, { activeOnly: true });

  if (user) {
    // Limpia OTPs previos del mismo email
    await PasswordResetOtpRepository.deleteByEmail(email);
    // Construye el nuevo OTP con expiración
    const otp = PasswordResetOtpRepository.create({
      email,
      code: generateOtpCode(),
      expires_at: new Date(Date.now() + OTP_TTL_MS),
      used: false,
    });
    // Persiste el OTP y envía el correo
    await PasswordResetOtpRepository.save(otp);
    await sendOtpEmail(email, otp.code);
  }

  // Respuesta neutra: no revela si el email está registrado
  return { message: 'Si el correo está registrado, recibirás un código de verificación' };
};

// Paso 2: valida el OTP y cambia la contraseña
export const resetPassword = async (
  email: string,
  code: string,
  newPassword: string,
): Promise<{ message: string }> => {
  // Normaliza el email
  email = email.toLowerCase();

  // Busca un OTP no usado que coincida con email + código
  const otp = await PasswordResetOtpRepository.findValid(email, code);
  if (!otp) throw Object.assign(new Error('Código inválido'), { status: 400 });

  // Si el OTP expiró, lo elimina y rechaza
  if (otp.expires_at <= new Date()) {
    await PasswordResetOtpRepository.deleteById(otp.id);
    throw Object.assign(new Error('Código expirado'), { status: 400 });
  }

  // Consume el OTP eliminándolo
  await PasswordResetOtpRepository.deleteById(otp.id);

  // Verifica que el usuario siga activo
  const user = await UserRepository.findByEmail(email, { activeOnly: true });
  if (!user) throw Object.assign(new Error('Usuario no encontrado'), { status: 404 });

  // Hashea y persiste la nueva contraseña
  const password_hash = await bcrypt.hash(newPassword, 10);
  await UserRepository.updateByEmail(email, { password_hash });

  // Confirma al cliente
  return { message: 'Contraseña actualizada correctamente' };
};
