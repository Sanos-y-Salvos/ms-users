jest.mock('../../src/services/user.service', () => ({
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
}));

import * as UserService from '../../src/services/user.service';
import * as Ctrl from '../../src/controllers/user.controller';

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
});

describe('desactivarCuenta controller', () => {
  it('200 al desactivar', async () => {
    const res = mockRes();
    await Ctrl.desactivarCuenta({ user: { id: '1' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(200);
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
});
