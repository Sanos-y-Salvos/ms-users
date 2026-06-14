// Valida el dígito verificador de RUN/RUT chileno usando módulo 11
export const validarDigitoVerificador = (valor: string): boolean => {
  // Normaliza: quita puntos, guiones y espacios; pasa a mayúsculas (para 'K')
  const limpio = valor.replace(/[\.\-\s]/g, '').toUpperCase();

  // Necesita al menos 2 caracteres (cuerpo + dv)
  if (limpio.length < 2) return false;

  // Separa el cuerpo numérico del dígito verificador ingresado
  const cuerpo = limpio.slice(0, -1);
  const digitoIngresado = limpio.slice(-1);

  // El cuerpo debe ser numérico
  if (!/^\d+$/.test(cuerpo)) return false;

  // Acumuladores para el cálculo del módulo 11
  let suma = 0;
  let multiplicador = 2;

  // Recorre el cuerpo de derecha a izquierda multiplicando por 2..7 cíclico
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  // Calcula el dígito esperado: 0, K, o (11 - resto)
  const resto = suma % 11;
  const digitoCalculado = resto === 0 ? '0' : resto === 1 ? 'K' : String(11 - resto);

  // Compara el dígito ingresado con el calculado
  return digitoIngresado === digitoCalculado;
};
