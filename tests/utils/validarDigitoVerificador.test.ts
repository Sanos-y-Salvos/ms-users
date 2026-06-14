import { validarDigitoVerificador } from '../../src/utils/validarDigitoVerificador';

describe('validarDigitoVerificador', () => {
  it('valida un RUT correcto con DV numérico', () => {
    // 11.111.111-1
    expect(validarDigitoVerificador('11111111-1')).toBe(true);
  });

  it('valida un RUT correcto con DV K', () => {
    expect(validarDigitoVerificador('12345678-5')).toBe(true);
  });

  it('rechaza un RUT con DV incorrecto', () => {
    expect(validarDigitoVerificador('11111111-2')).toBe(false);
  });

  it('rechaza un valor demasiado corto', () => {
    expect(validarDigitoVerificador('1')).toBe(false);
  });

  it('rechaza un cuerpo no numérico', () => {
    expect(validarDigitoVerificador('ABCDEFG-1')).toBe(false);
  });

  it('acepta separadores con puntos y guion', () => {
    expect(validarDigitoVerificador('11.111.111-1')).toBe(true);
  });

  it('acepta DV "K" en mayúsculas o minúsculas', () => {
    // 8.675.309-K
    expect(validarDigitoVerificador('8675309-k')).toBe(true);
    expect(validarDigitoVerificador('8675309-K')).toBe(true);
  });

  it('devuelve false con string vacío', () => {
    expect(validarDigitoVerificador('')).toBe(false);
  });
});
