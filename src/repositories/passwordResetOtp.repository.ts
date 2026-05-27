import { AppDataSource } from '../config/db';
import { PasswordResetOtp } from '../models/PasswordResetOtp';

const repo = () => AppDataSource.getRepository(PasswordResetOtp);

export const PasswordResetOtpRepository = {
  create(data: Partial<PasswordResetOtp>): PasswordResetOtp {
    return repo().create(data);
  },

  async save(otp: PasswordResetOtp): Promise<PasswordResetOtp> {
    return repo().save(otp);
  },

  async findValid(email: string, code: string): Promise<PasswordResetOtp | null> {
    return repo().findOne({ where: { email, code, used: false } });
  },

  async deleteByEmail(email: string): Promise<void> {
    await repo().delete({ email });
  },

  async deleteById(id: string): Promise<void> {
    await repo().delete({ id });
  },
};
