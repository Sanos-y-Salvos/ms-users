jest.mock('../../services/user.service', () => ({
  registrarCiudadano: jest.fn(),
  registrarInstitucion: jest.fn(),
  obtenerPerfil: jest.fn(),
  actualizarPerfil: jest.fn(),
  desactivarCuenta: jest.fn(),
  listarUsuarios: jest.fn(),
  verUsuario: jest.fn(),
  cambiarEstadoUsuario: jest.fn(),
  cambiarRolUsuario: jest.fn(),
  editarDatosUsuario: jest.fn(),
  getEstadisticas: jest.fn(),
}));

import * as UserService from '../../services/user.service';
import * as Ctrl from '../../controllers/user.controller';

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const bodyCiudadanoValido = {
  email: 'a@b.cl',
  password: 'secret1',
  telefono: '+56911111111',
  region: 'RM',
  comuna: 'X',
  primer_nombre: 'Juan',
  apellido_paterno: 'Perez',
  run: '11111111-1',
  direccion: 'Calle 1',
};

describe('registrarCiudadano controller', () => {
  beforeEach(() => jest.clearAllMocks());

  it('400 si faltan campos requeridos', async () => {
    const res = mockRes();
    await Ctrl.registrarCiudadano({ body: {} } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('400 con email inválido', async () => {
    const res = mockRes();
    await Ctrl.registrarCiudadano({ body: { ...bodyCiudadanoValido, email: 'no-email' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('400 con password corta', async () => {
    const res = mockRes();
    await Ctrl.registrarCiudadano({ body: { ...bodyCiudadanoValido, password: '123' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('400 con teléfono inválido', async () => {
    const res = mockRes();
    await Ctrl.registrarCiudadano({ body: { ...bodyCiudadanoValido, telefono: 'abc' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('400 con RUN inválido', async () => {
    const res = mockRes();
    await Ctrl.registrarCiudadano({ body: { ...bodyCiudadanoValido, run: '11111111-9' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('201 cuando el servicio retorna', async () => {
    (UserService.registrarCiudadano as jest.Mock).mockResolvedValue({ user: { id: '1' } });
    const res = mockRes();
    await Ctrl.registrarCiudadano({ body: bodyCiudadanoValido, file: undefined } as any, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('400 con primer_nombre inválido', async () => {
    const res = mockRes();
    await Ctrl.registrarCiudadano({ body: { ...bodyCiudadanoValido, primer_nombre: 'A1' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('400 con segundo_nombre inválido', async () => {
    const res = mockRes();
    await Ctrl.registrarCiudadano({ body: { ...bodyCiudadanoValido, segundo_nombre: 'A1' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('400 con apellido_paterno inválido', async () => {
    const res = mockRes();
    await Ctrl.registrarCiudadano({ body: { ...bodyCiudadanoValido, apellido_paterno: 'A1' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('400 con apellido_materno inválido', async () => {
    const res = mockRes();
    await Ctrl.registrarCiudadano({ body: { ...bodyCiudadanoValido, apellido_materno: 'A1' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('400 cuando el servicio lanza error', async () => {
    (UserService.registrarCiudadano as jest.Mock).mockRejectedValue(new Error('El correo ya está registrado'));
    const res = mockRes();
    await Ctrl.registrarCiudadano({ body: bodyCiudadanoValido, file: undefined } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

const bodyInstitucionValido = {
  email: 'vet@b.cl',
  password: 'secret1',
  telefono: '+56922222222',
  region: 'RM',
  comuna: 'X',
  nombre_institucion: 'Vet Sano',
  razon_social: 'Vet Sano SpA',
  rut: '11111111-1',
  tipo_institucion: 'veterinaria',
  direccion: 'Av 1',
};

describe('registrarInstitucion controller', () => {
  beforeEach(() => jest.clearAllMocks());

  it('400 si faltan campos', async () => {
    const res = mockRes();
    await Ctrl.registrarInstitucion({ body: {} } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('400 con RUT inválido', async () => {
    const res = mockRes();
    await Ctrl.registrarInstitucion({ body: { ...bodyInstitucionValido, rut: '11111111-9' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('201 cuando es válido', async () => {
    (UserService.registrarInstitucion as jest.Mock).mockResolvedValue({ user: { id: '2' } });
    const res = mockRes();
    await Ctrl.registrarInstitucion({ body: bodyInstitucionValido, file: undefined } as any, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('400 con email inválido', async () => {
    const res = mockRes();
    await Ctrl.registrarInstitucion({ body: { ...bodyInstitucionValido, email: 'no-email' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('400 con password corta', async () => {
    const res = mockRes();
    await Ctrl.registrarInstitucion({ body: { ...bodyInstitucionValido, password: '123' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('400 con teléfono inválido', async () => {
    const res = mockRes();
    await Ctrl.registrarInstitucion({ body: { ...bodyInstitucionValido, telefono: 'abc' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('400 con nombre_institucion inválido', async () => {
    const res = mockRes();
    await Ctrl.registrarInstitucion({ body: { ...bodyInstitucionValido, nombre_institucion: 'A1' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('400 con razon_social inválida', async () => {
    const res = mockRes();
    await Ctrl.registrarInstitucion({ body: { ...bodyInstitucionValido, razon_social: 'A1' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('400 cuando el servicio lanza error', async () => {
    (UserService.registrarInstitucion as jest.Mock).mockRejectedValue(new Error('El correo ya está registrado'));
    const res = mockRes();
    await Ctrl.registrarInstitucion({ body: bodyInstitucionValido, file: undefined } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('obtenerPerfil controller', () => {
  it('200 cuando existe', async () => {
    (UserService.obtenerPerfil as jest.Mock).mockResolvedValue({ id: '1' });
    const res = mockRes();
    await Ctrl.obtenerPerfil({ user: { id: '1' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('404 si no existe', async () => {
    (UserService.obtenerPerfil as jest.Mock).mockRejectedValue(new Error('Usuario no encontrado'));
    const res = mockRes();
    await Ctrl.obtenerPerfil({ user: { id: '1' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('actualizarPerfil controller', () => {
  beforeEach(() => jest.clearAllMocks());

  it('400 con teléfono inválido', async () => {
    const res = mockRes();
    await Ctrl.actualizarPerfil({ body: { telefono: 'abc' }, user: { id: '1' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('200 con body vacío', async () => {
    (UserService.actualizarPerfil as jest.Mock).mockResolvedValue({ id: '1' });
    const res = mockRes();
    await Ctrl.actualizarPerfil({ body: {}, user: { id: '1' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('400 con primer_nombre inválido', async () => {
    const res = mockRes();
    await Ctrl.actualizarPerfil({ body: { primer_nombre: 'A1' }, user: { id: '1' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('400 con segundo_nombre inválido (no vacío)', async () => {
    const res = mockRes();
    await Ctrl.actualizarPerfil({ body: { segundo_nombre: 'A1' }, user: { id: '1' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('200 con segundo_nombre vacío (permitido)', async () => {
    (UserService.actualizarPerfil as jest.Mock).mockResolvedValue({ id: '1' });
    const res = mockRes();
    await Ctrl.actualizarPerfil({ body: { segundo_nombre: '' }, user: { id: '1' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('400 con apellido_paterno inválido', async () => {
    const res = mockRes();
    await Ctrl.actualizarPerfil({ body: { apellido_paterno: 'A1' }, user: { id: '1' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('400 con apellido_materno inválido (no vacío)', async () => {
    const res = mockRes();
    await Ctrl.actualizarPerfil({ body: { apellido_materno: 'A1' }, user: { id: '1' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('200 con apellido_materno vacío (permitido)', async () => {
    (UserService.actualizarPerfil as jest.Mock).mockResolvedValue({ id: '1' });
    const res = mockRes();
    await Ctrl.actualizarPerfil({ body: { apellido_materno: '' }, user: { id: '1' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('400 con nombre_institucion inválido', async () => {
    const res = mockRes();
    await Ctrl.actualizarPerfil({ body: { nombre_institucion: 'A1' }, user: { id: '1' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('400 con razon_social inválida', async () => {
    const res = mockRes();
    await Ctrl.actualizarPerfil({ body: { razon_social: 'A1' }, user: { id: '1' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('400 cuando el servicio lanza error', async () => {
    (UserService.actualizarPerfil as jest.Mock).mockRejectedValue(new Error('Usuario no encontrado'));
    const res = mockRes();
    await Ctrl.actualizarPerfil({ body: {}, user: { id: '1' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('desactivarCuenta controller', () => {
  it('200 al desactivar', async () => {
    (UserService.desactivarCuenta as jest.Mock).mockResolvedValue(undefined);
    const res = mockRes();
    await Ctrl.desactivarCuenta({ user: { id: '1' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('400 cuando el servicio lanza error', async () => {
    (UserService.desactivarCuenta as jest.Mock).mockRejectedValue(new Error('Error interno'));
    const res = mockRes();
    await Ctrl.desactivarCuenta({ user: { id: '1' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('listarUsuarios controller', () => {
  it('200 con filtros', async () => {
    (UserService.listarUsuarios as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    await Ctrl.listarUsuarios(
      { query: { rol: 'ciudadano', is_active: 'true' }, user: { role: 'administrador' } } as any,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('200 sin is_active en query (rama undefined)', async () => {
    (UserService.listarUsuarios as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    await Ctrl.listarUsuarios(
      { query: { rol: 'ciudadano' }, user: { role: 'administrador' } } as any,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('200 con is_active=false convierte a boolean false', async () => {
    (UserService.listarUsuarios as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    await Ctrl.listarUsuarios(
      { query: { is_active: 'false' }, user: { role: 'administrador' } } as any,
      res,
    );
    expect(UserService.listarUsuarios).toHaveBeenCalledWith(
      expect.objectContaining({ is_active: false }),
      expect.any(String),
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('400 cuando el servicio lanza error', async () => {
    (UserService.listarUsuarios as jest.Mock).mockRejectedValue(new Error('Error interno'));
    const res = mockRes();
    await Ctrl.listarUsuarios(
      { query: {}, user: { role: 'administrador' } } as any,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('verUsuario controller', () => {
  it('200 cuando existe', async () => {
    (UserService.verUsuario as jest.Mock).mockResolvedValue({ id: '1' });
    const res = mockRes();
    await Ctrl.verUsuario({ params: { id: '1' }, user: { role: 'admin' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('usa err.status o 404', async () => {
    (UserService.verUsuario as jest.Mock).mockRejectedValue(
      Object.assign(new Error('Acceso denegado'), { status: 403 }),
    );
    const res = mockRes();
    await Ctrl.verUsuario({ params: { id: '1' }, user: { role: 'admin' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('usa 404 por defecto cuando el error no tiene status', async () => {
    (UserService.verUsuario as jest.Mock).mockRejectedValue(new Error('Usuario no encontrado'));
    const res = mockRes();
    await Ctrl.verUsuario({ params: { id: '1' }, user: { role: 'admin' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('cambiarEstadoUsuario y cambiarRolUsuario controllers', () => {
  it('cambiarEstado 200', async () => {
    (UserService.cambiarEstadoUsuario as jest.Mock).mockResolvedValue({ id: '1' });
    const res = mockRes();
    await Ctrl.cambiarEstadoUsuario(
      { params: { id: '1' }, body: { is_active: false }, user: { role: 'admin' } } as any,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('cambiarEstado propaga error sin status (usa 400 por defecto)', async () => {
    (UserService.cambiarEstadoUsuario as jest.Mock).mockRejectedValue(new Error('Error interno'));
    const res = mockRes();
    await Ctrl.cambiarEstadoUsuario(
      { params: { id: '1' }, body: { is_active: false }, user: { role: 'admin' } } as any,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('cambiarRol 200 cuando el servicio retorna', async () => {
    (UserService.cambiarRolUsuario as jest.Mock).mockResolvedValue({ id: '1', rol: 'moderador' });
    const res = mockRes();
    await Ctrl.cambiarRolUsuario(
      { params: { id: '1' }, body: { rol: 'moderador' }, user: { role: 'superadmin' } } as any,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('cambiarRol propaga error.status', async () => {
    (UserService.cambiarRolUsuario as jest.Mock).mockRejectedValue(
      Object.assign(new Error('Rol inválido'), { status: 400 }),
    );
    const res = mockRes();
    await Ctrl.cambiarRolUsuario(
      { params: { id: '1' }, body: { rol: 'pirata' }, user: { role: 'superadmin' } } as any,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('cambiarRol usa 400 por defecto cuando error no tiene status', async () => {
    (UserService.cambiarRolUsuario as jest.Mock).mockRejectedValue(new Error('Error interno'));
    const res = mockRes();
    await Ctrl.cambiarRolUsuario(
      { params: { id: '1' }, body: { rol: 'pirata' }, user: { role: 'superadmin' } } as any,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('editarDatosUsuario controller', () => {
  it('400 con primer_nombre inválido', async () => {
    const res = mockRes();
    await Ctrl.editarDatosUsuario(
      { params: { id: '1' }, body: { primer_nombre: 'A1' }, user: { role: 'admin' } } as any,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('200 con body válido', async () => {
    (UserService.editarDatosUsuario as jest.Mock).mockResolvedValue({ id: '1' });
    const res = mockRes();
    await Ctrl.editarDatosUsuario(
      { params: { id: '1' }, body: { telefono: '+5691' }, user: { role: 'admin' } } as any,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('400 con telefono inválido', async () => {
    const res = mockRes();
    await Ctrl.editarDatosUsuario(
      { params: { id: '1' }, body: { telefono: 'abc' }, user: { role: 'admin' } } as any,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('400 con segundo_nombre inválido', async () => {
    const res = mockRes();
    await Ctrl.editarDatosUsuario(
      { params: { id: '1' }, body: { segundo_nombre: 'A1' }, user: { role: 'admin' } } as any,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('200 con segundo_nombre vacío (permitido)', async () => {
    (UserService.editarDatosUsuario as jest.Mock).mockResolvedValue({ id: '1' });
    const res = mockRes();
    await Ctrl.editarDatosUsuario(
      { params: { id: '1' }, body: { segundo_nombre: '' }, user: { role: 'admin' } } as any,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('400 con apellido_paterno inválido', async () => {
    const res = mockRes();
    await Ctrl.editarDatosUsuario(
      { params: { id: '1' }, body: { apellido_paterno: 'A1' }, user: { role: 'admin' } } as any,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('400 con apellido_materno inválido', async () => {
    const res = mockRes();
    await Ctrl.editarDatosUsuario(
      { params: { id: '1' }, body: { apellido_materno: 'A1' }, user: { role: 'admin' } } as any,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('200 con apellido_materno vacío (permitido)', async () => {
    (UserService.editarDatosUsuario as jest.Mock).mockResolvedValue({ id: '1' });
    const res = mockRes();
    await Ctrl.editarDatosUsuario(
      { params: { id: '1' }, body: { apellido_materno: '' }, user: { role: 'admin' } } as any,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('400 con nombre_institucion inválido', async () => {
    const res = mockRes();
    await Ctrl.editarDatosUsuario(
      { params: { id: '1' }, body: { nombre_institucion: 'A1' }, user: { role: 'admin' } } as any,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('400 con razon_social inválida', async () => {
    const res = mockRes();
    await Ctrl.editarDatosUsuario(
      { params: { id: '1' }, body: { razon_social: 'A1' }, user: { role: 'admin' } } as any,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('propaga error sin status (usa 400 por defecto)', async () => {
    (UserService.editarDatosUsuario as jest.Mock).mockRejectedValue(new Error('Error interno'));
    const res = mockRes();
    await Ctrl.editarDatosUsuario(
      { params: { id: '1' }, body: {}, user: { role: 'admin' } } as any,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('getEstadisticas', () => {
  it('200 con estadísticas del servicio', async () => {
    const stats = { total: 10, activos: 8 };
    (UserService.getEstadisticas as jest.Mock).mockResolvedValue(stats);
    const res = mockRes();
    await Ctrl.getEstadisticas({} as any, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true, data: stats }));
  });

  it('400 si el servicio lanza', async () => {
    (UserService.getEstadisticas as jest.Mock).mockRejectedValue(new Error('db error'));
    const res = mockRes();
    await Ctrl.getEstadisticas({} as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
