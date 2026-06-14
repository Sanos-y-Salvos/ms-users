// Validador de dígito verificador para RUN/RUT
import { validarDigitoVerificador } from './validarDigitoVerificador';

// Acepta solo letras (incluye tildes y ñ) y espacios, mínimo 3 caracteres
export const esNombreValido = (valor: string): boolean =>
  /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]{3,}$/.test(valor.trim());

// Validación básica de email: usuario@dominio.tld
export const esEmailValido = (valor: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim());

// Acepta solo dígitos con '+' opcional al inicio
export const esTelefonoValido = (valor: string): boolean =>
  /^\+?[0-9]+$/.test(valor);

// Normaliza RUN/RUT al formato "cuerpo-dv" y valida su dígito
export const normalizarYValidarRut = (valor: string): { valido: boolean; normalizado: string } => {
  // Limpieza de separadores y mayúsculas para 'K'
  const limpio = valor.replace(/[\.\-\s]/g, '').toUpperCase();
  // Si es muy corto, inválido
  if (limpio.length < 2) return { valido: false, normalizado: '' };

  // Separa cuerpo y dígito verificador
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  // Reconstruye el formato canónico con guion
  const normalizado = `${cuerpo}-${dv}`;

  // Devuelve si pasa la validación y el valor normalizado
  return { valido: validarDigitoVerificador(valor), normalizado };
};
