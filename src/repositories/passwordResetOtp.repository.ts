// DataSource configurado
import { AppDataSource } from '../config/db';
// Entidad de OTPs
import { PasswordResetOtp } from '../models/PasswordResetOtp';

// Helper lazy para obtener el repositorio
const repo = () => AppDataSource.getRepository(PasswordResetOtp);

// API de acceso a datos de códigos OTP de reseteo de contraseña
export const PasswordResetOtpRepository = {
  // Crea instancia en memoria
  create(data: Partial<PasswordResetOtp>): PasswordResetOtp {
    return repo().create(data);
  },

  // Persiste la entidad
  async save(otp: PasswordResetOtp): Promise<PasswordResetOtp> {
    return repo().save(otp);
  },

  // Busca un OTP válido (no usado) por email + código
  async findValid(email: string, code: string): Promise<PasswordResetOtp | null> {
    return repo().findOne({ where: { email, code, used: false } });
  },

  // Elimina todos los OTPs asociados a un email (antes de generar uno nuevo)
  async deleteByEmail(email: string): Promise<void> {
    await repo().delete({ email });
  },

  // Elimina un OTP por id (después de usarlo o si expira)
  async deleteById(id: string): Promise<void> {
    await repo().delete({ id });
  },
};
