import {
  esNombreValido,
  esEmailValido,
  esTelefonoValido,
  normalizarYValidarRut,
} from '../../src/utils/validators';

describe('esNombreValido', () => {
  it('acepta nombres con letras y tildes', () => {
    expect(esNombreValido('José')).toBe(true);
    expect(esNombreValido('María Ñire')).toBe(true);
  });

  it('rechaza nombres con números o símbolos', () => {
    expect(esNombreValido('Juan1')).toBe(false);
    expect(esNombreValido('Juan-Pe')).toBe(false);
  });

  it('rechaza nombres con menos de 3 caracteres', () => {
    expect(esNombreValido('Jo')).toBe(false);
  });
});

describe('esEmailValido', () => {
  it('acepta emails válidos', () => {
    expect(esEmailValido('user@example.com')).toBe(true);
    expect(esEmailValido('a.b+c@dominio.cl')).toBe(true);
  });

  it('rechaza emails inválidos', () => {
    expect(esEmailValido('user@')).toBe(false);
    expect(esEmailValido('user@dom')).toBe(false);
    expect(esEmailValido('userdom.com')).toBe(false);
    expect(esEmailValido('user @dominio.com')).toBe(false);
  });
});

describe('esTelefonoValido', () => {
  it('acepta dígitos con o sin "+" inicial', () => {
    expect(esTelefonoValido('+56912345678')).toBe(true);
    expect(esTelefonoValido('12345678')).toBe(true);
  });

  it('rechaza teléfonos con letras o espacios', () => {
    expect(esTelefonoValido('1234abc')).toBe(false);
    expect(esTelefonoValido('+56 9 1234')).toBe(false);
  });
});

describe('normalizarYValidarRut', () => {
  it('normaliza al formato cuerpo-dv y valida', () => {
    const r = normalizarYValidarRut('11.111.111-1');
    expect(r.valido).toBe(true);
    expect(r.normalizado).toBe('11111111-1');
  });

  it('marca como inválido un RUT corto', () => {
    const r = normalizarYValidarRut('1');
    expect(r.valido).toBe(false);
    expect(r.normalizado).toBe('');
  });

  it('marca inválido si DV no coincide', () => {
    const r = normalizarYValidarRut('11111111-2');
    expect(r.valido).toBe(false);
    expect(r.normalizado).toBe('11111111-2');
  });

  it('mayúsculas K se conservan en normalizado', () => {
    const r = normalizarYValidarRut('8675309-k');
    expect(r.normalizado).toBe('8675309-K');
    expect(r.valido).toBe(true);
  });
});
