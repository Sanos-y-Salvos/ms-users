// Mockeamos repositorios y bcrypt antes de importar el módulo bajo prueba
jest.mock('../../src/repositories/user.repository', () => ({
  UserRepository: {
    create: jest.fn((data) => ({ ...data })),
    save: jest.fn(async (u) => u),
  },
}));
jest.mock('../../src/repositories/ciudadano.repository', () => ({
  CiudadanoRepository: {
    create: jest.fn((data) => ({ ...data })),
    save: jest.fn(async (c) => c),
  },
}));
jest.mock('../../src/repositories/institucion.repository', () => ({
  InstitucionRepository: {
    create: jest.fn((data) => ({ ...data })),
    save: jest.fn(async (i) => i),
  },
}));
jest.mock('bcrypt', () => ({
  hash: jest.fn(async () => 'hashed-password'),
}));
jest.mock('uuid', () => ({ v4: () => 'uuid-1234' }));

import { CiudadanoCreator, InstitucionCreator } from '../../src/factories/UserFactory';
import { RolUsuario, TipoUsuario } from '../../src/models/User';
import { TipoInstitucion } from '../../src/models/Institucion';
import { UserRepository } from '../../src/repositories/user.repository';
import { CiudadanoRepository } from '../../src/repositories/ciudadano.repository';
import { InstitucionRepository } from '../../src/repositories/institucion.repository';

const datosCiudadanoValidos = {
  email: 'JUAN@correo.cl',
  password: 'secret123',
  telefono: '+56911111111',
  region: 'RM',
  comuna: 'Santiago',
  primer_nombre: 'Juan',
  apellido_paterno: 'Pérez',
  run: '11111111-1',
  direccion: 'Calle 1',
};

const datosInstitucionValidos = {
  email: 'vet@correo.cl',
  password: 'secret123',
  telefono: '+56922222222',
  region: 'RM',
  comuna: 'Santiago',
  nombre_institucion: 'VetSano',
  razon_social: 'VetSano SpA',
  rut: '11111111-1',
  tipo_institucion: TipoInstitucion.VETERINARIA,
  direccion: 'Av 1',
};

describe('CiudadanoCreator', () => {
  it('crea User + Ciudadano con email normalizado, hash y rol correcto', async () => {
    const { user, entidad } = await new CiudadanoCreator().crear(datosCiudadanoValidos);
    expect(user.email).toBe('juan@correo.cl');
    expect(user.password_hash).toBe('hashed-password');
    expect(user.rol).toBe(RolUsuario.CIUDADANO);
    expect(user.tipo).toBe(TipoUsuario.CIUDADANO);
    expect(user.credential_id).toBe('uuid-1234');
    expect(entidad.primer_nombre).toBe('Juan');
    expect(UserRepository.save).toHaveBeenCalled();
    expect(CiudadanoRepository.save).toHaveBeenCalled();
  });

  it('lanza error si el RUN es inválido', async () => {
    await expect(
      new CiudadanoCreator().crear({ ...datosCiudadanoValidos, run: '11111111-9' }),
    ).rejects.toThrow('RUN inválido');
  });

  it('traduce el error 23505 a "El correo ya está registrado"', async () => {
    (UserRepository.save as jest.Mock).mockRejectedValueOnce({ code: '23505' });
    await expect(new CiudadanoCreator().crear(datosCiudadanoValidos)).rejects.toThrow(
      'El correo ya está registrado',
    );
  });

  it('relanza errores desconocidos de save', async () => {
    (UserRepository.save as jest.Mock).mockRejectedValueOnce(new Error('db down'));
    await expect(new CiudadanoCreator().crear(datosCiudadanoValidos)).rejects.toThrow('db down');
  });
});

describe('InstitucionCreator', () => {
  it('asigna rol VETERINARIA cuando el tipo es veterinaria', async () => {
    const { user } = await new InstitucionCreator().crear(datosInstitucionValidos);
    expect(user.rol).toBe(RolUsuario.VETERINARIA);
    expect(user.tipo).toBe(TipoUsuario.INSTITUCION);
    expect(InstitucionRepository.save).toHaveBeenCalled();
  });

  it('asigna rol MUNICIPALIDAD cuando el tipo es municipalidad', async () => {
    const { user } = await new InstitucionCreator().crear({
      ...datosInstitucionValidos,
      tipo_institucion: TipoInstitucion.MUNICIPALIDAD,
    });
    expect(user.rol).toBe(RolUsuario.MUNICIPALIDAD);
  });

  it('rechaza RUT inválido', async () => {
    await expect(
      new InstitucionCreator().crear({ ...datosInstitucionValidos, rut: '11111111-9' }),
    ).rejects.toThrow('RUT inválido');
  });

  it('rechaza tipo de institución inválido', async () => {
    await expect(
      new InstitucionCreator().crear({ ...datosInstitucionValidos, tipo_institucion: 'banco' as any }),
    ).rejects.toThrow('Tipo de institución inválido');
  });
});
