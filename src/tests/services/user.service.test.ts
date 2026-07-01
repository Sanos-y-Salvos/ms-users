jest.mock('../../events/event-emitter.service', () => ({
  emitUserRegistered: jest.fn(async () => undefined),
  emitUserUpdated: jest.fn(async () => undefined),
  emitUserDeleted: jest.fn(async () => undefined),
  emitUserPasswordChanged: jest.fn(async () => undefined),
}));
jest.mock('../../factories/UserFactory', () => ({
  CiudadanoCreator: jest.fn().mockImplementation(() => ({
    crear: jest.fn(async () => ({ user: { id: 'u1' }, entidad: { id: 'c1' } })),
  })),
  InstitucionCreator: jest.fn().mockImplementation(() => ({
    crear: jest.fn(async () => ({ user: { id: 'u2' }, entidad: { id: 'i1' } })),
  })),
}));
jest.mock('../../repositories/user.repository', () => ({
  UserRepository: {
    findByCredentialId: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    updateByCredentialId: jest.fn(),
    updateById: jest.fn(),
    getEstadisticas: jest.fn(),
  },
}));
jest.mock('../../repositories/ciudadano.repository', () => ({
  CiudadanoRepository: { updateById: jest.fn() },
}));
jest.mock('../../repositories/institucion.repository', () => ({
  InstitucionRepository: { updateById: jest.fn() },
}));
jest.mock('../../config/cloudinary', () => ({
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

import * as UserService from '../../services/user.service';
import { UserRepository } from '../../repositories/user.repository';
import { CiudadanoRepository } from '../../repositories/ciudadano.repository';
import { InstitucionRepository } from '../../repositories/institucion.repository';
import { RolUsuario } from '../../models/User';
import cloudinary from '../../config/cloudinary';

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

  it('rechaza cuando Cloudinary devuelve error', async () => {
    (cloudinary as any).uploader.upload_stream.mockImplementationOnce((_opts: any, cb: any) => ({
      end: () => cb(new Error('upload failed')),
    }));
    await expect(UserService.registrarCiudadano({ email: 'a@b.c' }, archivoFake)).rejects.toThrow('upload failed');
  });
});

describe('registrarInstitucion (service)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('delega al InstitucionCreator', async () => {
    const res = await UserService.registrarInstitucion({ tipo_institucion: 'veterinaria' });
    expect(res.institucion.id).toBe('i1');
  });

  it('con archivo sube a Cloudinary', async () => {
    const res = await UserService.registrarInstitucion({ tipo_institucion: 'veterinaria' }, archivoFake);
    expect((cloudinary as any).uploader.upload_stream).toHaveBeenCalled();
    expect(res.institucion.id).toBe('i1');
  });

  it('rechaza cuando Cloudinary devuelve error', async () => {
    (cloudinary as any).uploader.upload_stream.mockImplementationOnce((_opts: any, cb: any) => ({
      end: () => cb(new Error('upload failed')),
    }));
    await expect(UserService.registrarInstitucion({ tipo_institucion: 'veterinaria' }, archivoFake)).rejects.toThrow('upload failed');
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
    await UserService.actualizarPerfil('cred-1', {
      telefono: '+56911111111', region: 'RM', comuna: 'X',
      primer_nombre: 'Ana', segundo_nombre: 'B', apellido_paterno: 'C', apellido_materno: 'D', direccion: 'X',
    });
    expect(UserRepository.updateByCredentialId).toHaveBeenCalled();
    expect(CiudadanoRepository.updateById).toHaveBeenCalledWith('c1', expect.objectContaining({
      primer_nombre: 'Ana', segundo_nombre: 'B', apellido_paterno: 'C', apellido_materno: 'D', direccion: 'X',
    }));
  });

  it('actualiza institución cuando tipo es institucion', async () => {
    (UserRepository.findByCredentialId as jest.Mock)
      .mockResolvedValueOnce({ tipo: 'institucion', institucion: { id: 'i1' } })
      .mockResolvedValueOnce({ id: 'u2', tipo: 'institucion' });
    await UserService.actualizarPerfil('cred-2', { razon_social: 'NewSA', nombre_institucion: 'Vet', direccion: 'Av1' });
    expect(InstitucionRepository.updateById).toHaveBeenCalledWith('i1', expect.objectContaining({
      razon_social: 'NewSA', nombre_institucion: 'Vet', direccion: 'Av1',
    }));
  });

  it('no actualiza ciudadano si datosCiudadano está vacío', async () => {
    (UserRepository.findByCredentialId as jest.Mock)
      .mockResolvedValueOnce({ tipo: 'ciudadano', ciudadano: { id: 'c1' } })
      .mockResolvedValueOnce({ id: 'u1' });
    await UserService.actualizarPerfil('cred-1', {});
    expect(CiudadanoRepository.updateById).not.toHaveBeenCalled();
  });

  it('no actualiza institucion si datosInstitucion está vacío', async () => {
    (UserRepository.findByCredentialId as jest.Mock)
      .mockResolvedValueOnce({ tipo: 'institucion', institucion: { id: 'i1' } })
      .mockResolvedValueOnce({ id: 'u2' });
    await UserService.actualizarPerfil('cred-2', {});
    expect(InstitucionRepository.updateById).not.toHaveBeenCalled();
  });

  it('no actualiza si tipo no es ciudadano ni institucion', async () => {
    (UserRepository.findByCredentialId as jest.Mock)
      .mockResolvedValueOnce({ tipo: 'otro' })
      .mockResolvedValueOnce({ id: 'u3' });
    await UserService.actualizarPerfil('cred-3', { telefono: '+56911111111' });
    expect(CiudadanoRepository.updateById).not.toHaveBeenCalled();
    expect(InstitucionRepository.updateById).not.toHaveBeenCalled();
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

  it('destroy de cloudinary falla silenciosamente (catch vacío)', async () => {
    (cloudinary as any).uploader.destroy.mockRejectedValueOnce(new Error('destroy failed'));
    (UserRepository.findByCredentialId as jest.Mock)
      .mockResolvedValueOnce({
        tipo: 'ciudadano',
        ciudadano: { id: 'c1' },
        foto_perfil: 'https://res.cloudinary.com/x/image/upload/v1/sanos-salvos/perfiles/old.png',
      })
      .mockResolvedValueOnce({ id: 'u1' });
    await expect(UserService.actualizarPerfil('cred-1', {}, archivoFake)).resolves.not.toThrow();
  });

  it('sube foto sin foto_perfil previa (no llama a destroy)', async () => {
    (UserRepository.findByCredentialId as jest.Mock)
      .mockResolvedValueOnce({ tipo: 'ciudadano', ciudadano: { id: 'c1' }, foto_perfil: undefined })
      .mockResolvedValueOnce({ id: 'u1' });
    await UserService.actualizarPerfil('cred-1', {}, archivoFake);
    expect((cloudinary as any).uploader.destroy).not.toHaveBeenCalled();
    expect((cloudinary as any).uploader.upload_stream).toHaveBeenCalled();
  });

  it('foto_perfil sin match de regex no llama a destroy', async () => {
    (UserRepository.findByCredentialId as jest.Mock)
      .mockResolvedValueOnce({ tipo: 'ciudadano', ciudadano: { id: 'c1' }, foto_perfil: 'no-match-url' })
      .mockResolvedValueOnce({ id: 'u1' });
    await UserService.actualizarPerfil('cred-1', {}, archivoFake);
    expect((cloudinary as any).uploader.destroy).not.toHaveBeenCalled();
  });

  it('rechaza cuando Cloudinary falla al subir en actualizarPerfil', async () => {
    (UserRepository.findByCredentialId as jest.Mock)
      .mockResolvedValueOnce({ tipo: 'ciudadano', ciudadano: { id: 'c1' }, foto_perfil: undefined });
    (cloudinary as any).uploader.upload_stream.mockImplementationOnce((_opts: any, cb: any) => ({
      end: () => cb(new Error('upload failed')),
    }));
    await expect(UserService.actualizarPerfil('cred-1', {}, archivoFake)).rejects.toThrow('upload failed');
  });

  it('no llama a updateByCredentialId cuando no hay campos de usuario', async () => {
    (UserRepository.findByCredentialId as jest.Mock)
      .mockResolvedValueOnce({ tipo: 'ciudadano', ciudadano: { id: 'c1' } })
      .mockResolvedValueOnce({ id: 'u1' });
    await UserService.actualizarPerfil('cred-1', {});
    expect(UserRepository.updateByCredentialId).not.toHaveBeenCalled();
  });

  it('lanza 422 si el teléfono es inválido en actualizarPerfil', async () => {
    (UserRepository.findByCredentialId as jest.Mock).mockResolvedValue({ tipo: 'ciudadano', ciudadano: { id: 'c1' } });
    await expect(UserService.actualizarPerfil('cred-1', { telefono: 'invalido' })).rejects.toMatchObject({ status: 422 });
  });
});

describe('desactivarCuenta', () => {
  it('llama a updateByCredentialId con is_active=false', async () => {
    await UserService.desactivarCuenta('cred-1');
    expect(UserRepository.updateByCredentialId).toHaveBeenCalledWith('cred-1', { is_active: false });
  });
});

describe('getEstadisticas', () => {
  it('delega al repositorio', async () => {
    const stats = { total: 5, activos: 3 };
    (UserRepository.getEstadisticas as jest.Mock).mockResolvedValue(stats);
    const result = await UserService.getEstadisticas();
    expect(result).toBe(stats);
    expect(UserRepository.getEstadisticas).toHaveBeenCalled();
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

  it('filtra por rol sin is_active', async () => {
    (UserRepository.findAll as jest.Mock).mockResolvedValue([{ id: '1', rol: RolUsuario.CIUDADANO }]);
    const res = await UserService.listarUsuarios({ rol: 'ciudadano' }, 'administrador');
    expect(res).toHaveLength(1);
  });

  it('sin filtros devuelve todos los no-superadmin', async () => {
    (UserRepository.findAll as jest.Mock).mockResolvedValue([{ id: '1', rol: RolUsuario.CIUDADANO }]);
    const res = await UserService.listarUsuarios({}, 'administrador');
    expect(res).toHaveLength(1);
  });
});

describe('verUsuarioPorCredential', () => {
  it('devuelve usuario cuando existe y el caller tiene permiso', async () => {
    (UserRepository.findByCredentialId as jest.Mock).mockResolvedValue({ id: '1', rol: RolUsuario.CIUDADANO });
    const res = await UserService.verUsuarioPorCredential('cred-1', 'administrador');
    expect(res.id).toBe('1');
  });

  it('lanza si no existe', async () => {
    (UserRepository.findByCredentialId as jest.Mock).mockResolvedValue(null);
    await expect(UserService.verUsuarioPorCredential('cred-x')).rejects.toThrow('Usuario no encontrado');
  });

  it('lanza 403 si un no-superadmin intenta ver un superadmin', async () => {
    (UserRepository.findByCredentialId as jest.Mock).mockResolvedValue({ id: '2', rol: RolUsuario.SUPERADMIN });
    await expect(UserService.verUsuarioPorCredential('cred-2', 'administrador')).rejects.toMatchObject({ status: 403 });
  });

  it('permite ver superadmin cuando callerRole es superadmin', async () => {
    (UserRepository.findByCredentialId as jest.Mock).mockResolvedValue({ id: '2', rol: RolUsuario.SUPERADMIN });
    const res = await UserService.verUsuarioPorCredential('cred-2', 'superadmin');
    expect(res.id).toBe('2');
  });

  it('omite verificación de rol cuando callerRole es undefined', async () => {
    (UserRepository.findByCredentialId as jest.Mock).mockResolvedValue({ id: '2', rol: RolUsuario.SUPERADMIN });
    const res = await UserService.verUsuarioPorCredential('cred-2', undefined);
    expect(res.id).toBe('2');
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
  it('actualiza is_active a false', async () => {
    (UserRepository.findById as jest.Mock).mockResolvedValue({ id: '1', rol: RolUsuario.CIUDADANO, credential_id: 'c1' });
    const res = await UserService.cambiarEstadoUsuario('1', false, 'administrador');
    expect(UserRepository.updateById).toHaveBeenCalledWith('1', { is_active: false });
    expect(res.is_active).toBe(false);
  });

  it('actualiza is_active a true (rama active)', async () => {
    (UserRepository.findById as jest.Mock).mockResolvedValue({ id: '1', rol: RolUsuario.CIUDADANO, credential_id: 'c1' });
    const res = await UserService.cambiarEstadoUsuario('1', true, 'administrador');
    expect(UserRepository.updateById).toHaveBeenCalledWith('1', { is_active: true });
    expect(res.is_active).toBe(true);
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

describe('patchAuthCredential (via cambiarEstadoUsuario con INTERNAL_API_KEY)', () => {
  const originalEnv = process.env;
  beforeEach(() => {
    process.env = { ...originalEnv, INTERNAL_API_KEY: 'test-key', AUTH_URL: 'http://ms-auth:3001' };
  });
  afterEach(() => { process.env = originalEnv; });

  it('llama a fetch y continúa si resp.ok es true', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock as any;
    (UserRepository.findById as jest.Mock).mockResolvedValue({ id: '1', rol: RolUsuario.CIUDADANO, credential_id: 'c1' });
    await UserService.cambiarEstadoUsuario('1', false, 'administrador');
    expect(fetchMock).toHaveBeenCalled();
    delete (global as any).fetch;
  });

  it('registra warn si resp.ok es false', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchMock = jest.fn().mockResolvedValue({ ok: false, status: 503, text: async () => 'error' });
    global.fetch = fetchMock as any;
    (UserRepository.findById as jest.Mock).mockResolvedValue({ id: '1', rol: RolUsuario.CIUDADANO, credential_id: 'c1' });
    await UserService.cambiarEstadoUsuario('1', false, 'administrador');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
    delete (global as any).fetch;
  });

  it('usa cadena vacía si resp.text() lanza (catch vacío)', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: jest.fn().mockRejectedValue(new Error('text error')),
    });
    global.fetch = fetchMock as any;
    (UserRepository.findById as jest.Mock).mockResolvedValue({ id: '1', rol: RolUsuario.CIUDADANO, credential_id: 'c1' });
    await UserService.cambiarEstadoUsuario('1', false, 'administrador');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
    delete (global as any).fetch;
  });

  it('registra error si fetch lanza', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const fetchMock = jest.fn().mockRejectedValue(new Error('network error'));
    global.fetch = fetchMock as any;
    (UserRepository.findById as jest.Mock).mockResolvedValue({ id: '1', rol: RolUsuario.CIUDADANO, credential_id: 'c1' });
    await UserService.cambiarEstadoUsuario('1', false, 'administrador');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
    delete (global as any).fetch;
  });
});

describe('editarDatosUsuario', () => {
  it('actualiza todos los campos del ciudadano', async () => {
    (UserRepository.findById as jest.Mock)
      .mockResolvedValueOnce({ id: '1', tipo: 'ciudadano', rol: RolUsuario.CIUDADANO, ciudadano: { id: 'c1' } })
      .mockResolvedValueOnce({ id: '1', tipo: 'ciudadano', rol: RolUsuario.CIUDADANO, ciudadano: { id: 'c1' } });
    await UserService.editarDatosUsuario('1', {
      telefono: '+56911111111', region: 'RM', comuna: 'X',
      primer_nombre: 'Ana', segundo_nombre: 'B', apellido_paterno: 'C', apellido_materno: 'D', direccion: 'X',
    }, 'administrador');
    expect(UserRepository.updateById).toHaveBeenCalled();
    expect(CiudadanoRepository.updateById).toHaveBeenCalled();
  });

  it('actualiza todos los campos de la institución', async () => {
    (UserRepository.findById as jest.Mock)
      .mockResolvedValueOnce({ id: '2', tipo: 'institucion', rol: RolUsuario.VETERINARIA, institucion: { id: 'i1' } })
      .mockResolvedValueOnce({ id: '2', tipo: 'institucion', rol: RolUsuario.VETERINARIA, institucion: { id: 'i1' } });
    await UserService.editarDatosUsuario('2', { razon_social: 'NewSA', nombre_institucion: 'Vet', direccion: 'Av1' }, 'administrador');
    expect(InstitucionRepository.updateById).toHaveBeenCalled();
  });

  it('no actualiza si datosUser está vacío', async () => {
    (UserRepository.findById as jest.Mock)
      .mockResolvedValueOnce({ id: '1', tipo: 'ciudadano', rol: RolUsuario.CIUDADANO, ciudadano: { id: 'c1' } })
      .mockResolvedValueOnce({ id: '1', tipo: 'ciudadano', rol: RolUsuario.CIUDADANO, ciudadano: { id: 'c1' } });
    await UserService.editarDatosUsuario('1', {}, 'administrador');
    expect(UserRepository.updateById).not.toHaveBeenCalled();
  });

  it('no actualiza ciudadano si datosCiudadano está vacío', async () => {
    (UserRepository.findById as jest.Mock)
      .mockResolvedValueOnce({ id: '1', tipo: 'ciudadano', rol: RolUsuario.CIUDADANO, ciudadano: { id: 'c1' } })
      .mockResolvedValueOnce({ id: '1', tipo: 'ciudadano', rol: RolUsuario.CIUDADANO, ciudadano: { id: 'c1' } });
    await UserService.editarDatosUsuario('1', { telefono: '+56911111111' }, 'administrador');
    expect(CiudadanoRepository.updateById).not.toHaveBeenCalled();
  });

  it('no actualiza institución si datosInstitucion está vacío', async () => {
    (UserRepository.findById as jest.Mock)
      .mockResolvedValueOnce({ id: '2', tipo: 'institucion', rol: RolUsuario.VETERINARIA, institucion: { id: 'i1' } })
      .mockResolvedValueOnce({ id: '2', tipo: 'institucion', rol: RolUsuario.VETERINARIA, institucion: { id: 'i1' } });
    await UserService.editarDatosUsuario('2', { telefono: '+56911111111' }, 'administrador');
    expect(InstitucionRepository.updateById).not.toHaveBeenCalled();
  });

  it('lanza 422 si el teléfono es inválido en editarDatosUsuario', async () => {
    (UserRepository.findById as jest.Mock)
      .mockResolvedValueOnce({ id: '1', tipo: 'ciudadano', rol: RolUsuario.CIUDADANO, ciudadano: { id: 'c1' } });
    await expect(UserService.editarDatosUsuario('1', { telefono: 'invalido' }, 'administrador')).rejects.toMatchObject({ status: 422 });
  });
});
