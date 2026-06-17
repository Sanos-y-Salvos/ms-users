jest.mock('../../src/events/event-emitter.service', () => ({
  emitUserRegistered: jest.fn(async () => undefined),
  emitUserUpdated: jest.fn(async () => undefined),
  emitUserDeleted: jest.fn(async () => undefined),
  emitUserPasswordChanged: jest.fn(async () => undefined),
}));
jest.mock('../../src/factories/UserFactory', () => ({
  CiudadanoCreator: jest.fn().mockImplementation(() => ({
    crear: jest.fn(async () => ({ user: { id: 'u1' }, entidad: { id: 'c1' } })),
  })),
  InstitucionCreator: jest.fn().mockImplementation(() => ({
    crear: jest.fn(async () => ({ user: { id: 'u2' }, entidad: { id: 'i1' } })),
  })),
}));
jest.mock('../../src/repositories/user.repository', () => ({
  UserRepository: {
    findByCredentialId: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    updateByCredentialId: jest.fn(),
    updateById: jest.fn(),
  },
}));
jest.mock('../../src/repositories/ciudadano.repository', () => ({
  CiudadanoRepository: { updateById: jest.fn() },
}));
jest.mock('../../src/repositories/institucion.repository', () => ({
  InstitucionRepository: { updateById: jest.fn() },
}));
jest.mock('../../src/config/cloudinary', () => ({
  __esModule: true,
  default: {
    uploader: {
      upload_stream: jest.fn((_opts, cb) => {
        return { end: () => cb(null, { secure_url: 'https://img/x.png' }) };
      }),
      destroy: jest.fn(async () => ({ result: 'ok' })),
    },
  },
}));

import * as UserService from '../../src/services/user.service';
import { UserRepository } from '../../src/repositories/user.repository';
import { CiudadanoRepository } from '../../src/repositories/ciudadano.repository';
import { InstitucionRepository } from '../../src/repositories/institucion.repository';
import { RolUsuario } from '../../src/models/User';
import cloudinary from '../../src/config/cloudinary';

const archivoFake = { buffer: Buffer.from('img') } as any;

describe('registrarCiudadano (service)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sin archivo no llama a Cloudinary', async () => {
    const res = await UserService.registrarCiudadano({ email: 'a@b.c' });
    expect((cloudinary as any).uploader.upload_stream).not.toHaveBeenCalled();
    expect(res.user.id).toBe('u1');
  });

  it('con archivo sube a Cloudinary y delega al creator', async () => {
    const res = await UserService.registrarCiudadano({ email: 'a@b.c' }, archivoFake);
    expect((cloudinary as any).uploader.upload_stream).toHaveBeenCalled();
    expect(res.ciudadano.id).toBe('c1');
  });
});

describe('registrarInstitucion (service)', () => {
  it('delega al InstitucionCreator', async () => {
    const res = await UserService.registrarInstitucion({ tipo_institucion: 'veterinaria' });
    expect(res.institucion.id).toBe('i1');
  });
});

describe('obtenerPerfil', () => {
  it('devuelve el usuario activo', async () => {
    (UserRepository.findByCredentialId as jest.Mock).mockResolvedValue({ id: 'u1' });
    const res = await UserService.obtenerPerfil('cred-1');
    expect(res.id).toBe('u1');
  });

  it('lanza si no existe', async () => {
    (UserRepository.findByCredentialId as jest.Mock).mockResolvedValue(null);
    await expect(UserService.obtenerPerfil('cred-x')).rejects.toThrow('Usuario no encontrado');
  });
});

describe('actualizarPerfil', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lanza si usuario no existe', async () => {
    (UserRepository.findByCredentialId as jest.Mock).mockResolvedValue(null);
    await expect(UserService.actualizarPerfil('cred-x', {})).rejects.toThrow('Usuario no encontrado');
  });

  it('actualiza ciudadano cuando tipo es ciudadano', async () => {
    (UserRepository.findByCredentialId as jest.Mock)
      .mockResolvedValueOnce({ tipo: 'ciudadano', ciudadano: { id: 'c1' } })
      .mockResolvedValueOnce({ id: 'u1', tipo: 'ciudadano' });
    await UserService.actualizarPerfil('cred-1', { telefono: '+5691', primer_nombre: 'Ana', direccion: 'X' });
    expect(UserRepository.updateByCredentialId).toHaveBeenCalled();
    expect(CiudadanoRepository.updateById).toHaveBeenCalledWith('c1', expect.objectContaining({
      primer_nombre: 'Ana', direccion: 'X',
    }));
  });

  it('actualiza institución cuando tipo es institucion', async () => {
    (UserRepository.findByCredentialId as jest.Mock)
      .mockResolvedValueOnce({ tipo: 'institucion', institucion: { id: 'i1' } })
      .mockResolvedValueOnce({ id: 'u2', tipo: 'institucion' });
    await UserService.actualizarPerfil('cred-2', { razon_social: 'NewSA' });
    expect(InstitucionRepository.updateById).toHaveBeenCalledWith('i1', expect.objectContaining({
      razon_social: 'NewSA',
    }));
  });

  it('sube nueva foto y elimina la anterior en Cloudinary', async () => {
    (UserRepository.findByCredentialId as jest.Mock)
      .mockResolvedValueOnce({
        tipo: 'ciudadano',
        ciudadano: { id: 'c1' },
        foto_perfil: 'https://res.cloudinary.com/x/image/upload/v1/sanos-salvos/perfiles/old.png',
      })
      .mockResolvedValueOnce({ id: 'u1' });
    await UserService.actualizarPerfil('cred-1', {}, archivoFake);
    expect((cloudinary as any).uploader.destroy).toHaveBeenCalled();
    expect((cloudinary as any).uploader.upload_stream).toHaveBeenCalled();
  });
});

describe('desactivarCuenta', () => {
  it('llama a updateByCredentialId con is_active=false', async () => {
    await UserService.desactivarCuenta('cred-1');
    expect(UserRepository.updateByCredentialId).toHaveBeenCalledWith('cred-1', { is_active: false });
  });
});

describe('listarUsuarios', () => {
  it('filtra superadmin para callers no-superadmin', async () => {
    (UserRepository.findAll as jest.Mock).mockResolvedValue([
      { id: '1', rol: RolUsuario.CIUDADANO },
      { id: '2', rol: RolUsuario.SUPERADMIN },
    ]);
    const res = await UserService.listarUsuarios({ is_active: true }, 'administrador');
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('1');
  });

  it('superadmin ve todos', async () => {
    (UserRepository.findAll as jest.Mock).mockResolvedValue([
      { id: '1', rol: RolUsuario.CIUDADANO },
      { id: '2', rol: RolUsuario.SUPERADMIN },
    ]);
    const res = await UserService.listarUsuarios(undefined, 'superadmin');
    expect(res).toHaveLength(2);
  });
});

describe('verUsuario', () => {
  it('rechaza non-superadmin viendo un superadmin', async () => {
    (UserRepository.findById as jest.Mock).mockResolvedValue({ id: '2', rol: RolUsuario.SUPERADMIN });
    await expect(UserService.verUsuario('2', 'administrador')).rejects.toMatchObject({ status: 403 });
  });

  it('devuelve usuario si tiene permiso', async () => {
    (UserRepository.findById as jest.Mock).mockResolvedValue({ id: '1', rol: RolUsuario.CIUDADANO });
    const res = await UserService.verUsuario('1', 'administrador');
    expect(res.id).toBe('1');
  });

  it('lanza si no existe', async () => {
    (UserRepository.findById as jest.Mock).mockResolvedValue(null);
    await expect(UserService.verUsuario('x')).rejects.toThrow('Usuario no encontrado');
  });
});

describe('cambiarEstadoUsuario', () => {
  it('actualiza is_active', async () => {
    (UserRepository.findById as jest.Mock).mockResolvedValue({ id: '1', rol: RolUsuario.CIUDADANO });
    const res = await UserService.cambiarEstadoUsuario('1', false, 'administrador');
    expect(UserRepository.updateById).toHaveBeenCalledWith('1', { is_active: false });
    expect(res.is_active).toBe(false);
  });
});

describe('cambiarRolUsuario', () => {
  it('rechaza rol inválido', async () => {
    await expect(UserService.cambiarRolUsuario('1', 'pirata', 'superadmin')).rejects.toMatchObject({ status: 400 });
  });

  it('actualiza rol válido', async () => {
    (UserRepository.findById as jest.Mock).mockResolvedValue({ id: '1', rol: RolUsuario.CIUDADANO });
    const res = await UserService.cambiarRolUsuario('1', 'moderador', 'superadmin');
    expect(UserRepository.updateById).toHaveBeenCalledWith('1', { rol: 'moderador' });
    expect(res.rol).toBe('moderador');
  });
});

describe('editarDatosUsuario', () => {
  it('actualiza campos del ciudadano', async () => {
    (UserRepository.findById as jest.Mock)
      .mockResolvedValueOnce({ id: '1', tipo: 'ciudadano', rol: RolUsuario.CIUDADANO, ciudadano: { id: 'c1' } })
      .mockResolvedValueOnce({ id: '1', tipo: 'ciudadano', rol: RolUsuario.CIUDADANO, ciudadano: { id: 'c1' } });
    await UserService.editarDatosUsuario('1', { telefono: '+5691', primer_nombre: 'Ana' }, 'administrador');
    expect(UserRepository.updateById).toHaveBeenCalled();
    expect(CiudadanoRepository.updateById).toHaveBeenCalled();
  });

  it('actualiza campos de la institución', async () => {
    (UserRepository.findById as jest.Mock)
      .mockResolvedValueOnce({ id: '2', tipo: 'institucion', rol: RolUsuario.VETERINARIA, institucion: { id: 'i1' } })
      .mockResolvedValueOnce({ id: '2', tipo: 'institucion', rol: RolUsuario.VETERINARIA, institucion: { id: 'i1' } });
    await UserService.editarDatosUsuario('2', { razon_social: 'NewSA' }, 'administrador');
    expect(InstitucionRepository.updateById).toHaveBeenCalled();
  });
});
