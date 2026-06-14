// Cliente SMTP para envío de correos
import nodemailer from 'nodemailer';

// Transporte configurado con Gmail usando contraseña de aplicación
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Envía un correo con el código OTP para recuperar contraseña
export const sendOtpEmail = async (email: string, code: string): Promise<void> => {
  try {
    // Envía el correo HTML al destinatario indicado
    await transporter.sendMail({
      from: `"Sanos y Salvos" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Recuperación de contraseña — Sanos y Salvos',
      // Plantilla HTML con el código OTP destacado
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Recuperar contraseña</h2>
          <p>Tu código de verificación es:</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 24px 0; color: #2563eb;">
            ${code}
          </div>
          <p>Este código expira en <strong>10 minutos</strong>.</p>
          <p>Si no solicitaste esto, ignora este correo.</p>
        </div>
      `,
    });
  } catch (err: unknown) {
    // Normaliza el mensaje y relanza un Error con contexto
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Error al enviar el correo de recuperación: ${msg}`);
  }
};
