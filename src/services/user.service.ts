import { User, RolUsuario } from '../models/User';
import { Ciudadano } from '../models/Ciudadano';
import { Institucion, TipoInstitucion } from '../models/Institucion';
import { UserFactory } from '../factories/UserFactory';
import { UserRepository } from '../repositories/user.repository';
import { CiudadanoRepository } from '../repositories/ciudadano.repository';
import { InstitucionRepository } from '../repositories/institucion.repository';
import cloudinary from '../config/cloudinary';

// RF-05 — Registro ciudadano
export const registrarCiudadano = async (datos: any, archivo?: Express.Multer.File) => {
  let foto_perfil: string | undefined;

  if (archivo) {
    const resultado = await new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'sanos-salvos/perfiles' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!.secure_url);
        }
      );
      stream.end(archivo.buffer);
    });
    foto_perfil = resultado;
  }

  return UserFactory.crearCiudadano({ ...datos, foto_perfil });
};

// RF-05 — Registro institución
export const registrarInstitucion = async (datos: any, archivo?: Express.Multer.File) => {
  let foto_perfil: string | undefined;

  if (archivo) {
    const resultado = await new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'sanos-salvos/perfiles' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!.secure_url);
        }
      );
      stream.end(archivo.buffer);
    });
    foto_perfil = resultado;
  }

  return UserFactory.crearInstitucion({ ...datos, foto_perfil, tipo_institucion: datos.tipo_institucion as TipoInstitucion });
};

// RF-06 — Ver perfil
export const obtenerPerfil = async (credentialId: string) => {
  const user = await UserRepository.findByCredentialId(credentialId, { activeOnly: true, withRelations: true });
  if (!user) throw new Error('Usuario no encontrado');
  return user;
};

// RF-08 — Actualizar datos
export const actualizarPerfil = async (credentialId: string, datos: any, archivo?: Express.Multer.File) => {
  const user = await UserRepository.findByCredentialId(credentialId, { withRelations: true });
  if (!user) throw new Error('Usuario no encontrado');

  const { telefono, region, comuna, primer_nombre, segundo_nombre, apellido_paterno, apellido_materno, direccion, nombre_institucion, razon_social } = datos;

  const datosUser: Partial<User> = {};
  if (telefono !== undefined) datosUser.telefono = telefono;
  if (region !== undefined) datosUser.region = region;
  if (comuna !== undefined) datosUser.comuna = comuna;

  if (archivo) {
    if (user.foto_perfil) {
      const match = user.foto_perfil.match(/\/upload\/(?:v\d+\/)?(.+)\.[^./]+$/i);
      if (match) await cloudinary.uploader.destroy(match[1]).catch(() => {});
    }
    const foto_perfil = await new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'sanos-salvos/perfiles' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!.secure_url);
        }
      );
      stream.end(archivo.buffer);
    });
    datosUser.foto_perfil = foto_perfil;
  }

  if (Object.keys(datosUser).length > 0) {
    await UserRepository.updateByCredentialId(credentialId, datosUser);
  }

  if (user.tipo === 'ciudadano' && user.ciudadano) {
    const datosCiudadano: Partial<Ciudadano> = {};
    if (primer_nombre !== undefined) datosCiudadano.primer_nombre = primer_nombre;
    if (segundo_nombre !== undefined) datosCiudadano.segundo_nombre = segundo_nombre;
    if (apellido_paterno !== undefined) datosCiudadano.apellido_paterno = apellido_paterno;
    if (apellido_materno !== undefined) datosCiudadano.apellido_materno = apellido_materno;
    if (direccion !== undefined) datosCiudadano.direccion = direccion;
    if (Object.keys(datosCiudadano).length > 0) {
      await CiudadanoRepository.updateById(user.ciudadano.id, datosCiudadano);
    }
  }

  if (user.tipo === 'institucion' && user.institucion) {
    const datosInstitucion: Partial<Institucion> = {};
    if (nombre_institucion !== undefined) datosInstitucion.nombre_institucion = nombre_institucion;
    if (razon_social !== undefined) datosInstitucion.razon_social = razon_social;
    if (direccion !== undefined) datosInstitucion.direccion = direccion;
    if (Object.keys(datosInstitucion).length > 0) {
      await InstitucionRepository.updateById(user.institucion.id, datosInstitucion);
    }
  }

  const updatedUser = await UserRepository.findByCredentialId(credentialId, { withRelations: true });
  return updatedUser;
};

// RF-10 — Soft delete de cuenta propia
export const desactivarCuenta = async (credentialId: string) => {
  await UserRepository.updateByCredentialId(credentialId, { is_active: false });
};

// Admin — Listar usuarios
export const listarUsuarios = async (filtros?: { rol?: string; is_active?: boolean }, callerRole?: string) => {
  const where: any = {};
  if (filtros?.rol) where.rol = filtros.rol;
  if (filtros?.is_active !== undefined) where.is_active = filtros.is_active;

  const users = await UserRepository.findAll(where);

  if (callerRole !== 'superadmin') {
    return users.filter(u => u.rol !== RolUsuario.SUPERADMIN);
  }
  return users;
};

// Admin — Ver usuario
export const verUsuario = async (userId: string, callerRole?: string) => {
  const user = await UserRepository.findById(userId, { withRelations: true });
  if (!user) throw new Error('Usuario no encontrado');
  if (callerRole !== undefined && callerRole !== 'superadmin' && user.rol === RolUsuario.SUPERADMIN) {
    const err: any = new Error('Acceso denegado');
    err.status = 403;
    throw err;
  }
  return user;
};

// Admin — Cambiar estado (activo/inactivo)
export const cambiarEstadoUsuario = async (userId: string, is_active: boolean, callerRole?: string) => {
  const user = await verUsuario(userId, callerRole);
  await UserRepository.updateById(userId, { is_active });
  user.is_active = is_active;
  return user;
};

// Admin — Cambiar rol
export const cambiarRolUsuario = async (userId: string, rol: string, callerRole?: string) => {
  if (!Object.values(RolUsuario).includes(rol as RolUsuario)) {
    const err: any = new Error('Rol inválido');
    err.status = 400;
    throw err;
  }
  const user = await verUsuario(userId, callerRole);
  await UserRepository.updateById(userId, { rol: rol as RolUsuario });
  user.rol = rol as RolUsuario;
  return user;
};

// Admin — Editar datos
export const editarDatosUsuario = async (userId: string, datos: any, callerRole?: string) => {
  const user = await verUsuario(userId, callerRole);

  const { telefono, region, comuna, primer_nombre, segundo_nombre, apellido_paterno, apellido_materno, direccion, nombre_institucion, razon_social } = datos;

  const datosUser: Partial<User> = {};
  if (telefono !== undefined) datosUser.telefono = telefono;
  if (region !== undefined) datosUser.region = region;
  if (comuna !== undefined) datosUser.comuna = comuna;
  if (Object.keys(datosUser).length > 0) {
    await UserRepository.updateById(userId, datosUser);
  }

  if (user.tipo === 'ciudadano' && user.ciudadano) {
    const datosCiudadano: Partial<Ciudadano> = {};
    if (primer_nombre !== undefined) datosCiudadano.primer_nombre = primer_nombre;
    if (segundo_nombre !== undefined) datosCiudadano.segundo_nombre = segundo_nombre;
    if (apellido_paterno !== undefined) datosCiudadano.apellido_paterno = apellido_paterno;
    if (apellido_materno !== undefined) datosCiudadano.apellido_materno = apellido_materno;
    if (direccion !== undefined) datosCiudadano.direccion = direccion;
    if (Object.keys(datosCiudadano).length > 0) {
      await CiudadanoRepository.updateById(user.ciudadano.id, datosCiudadano);
    }
  }

  if (user.tipo === 'institucion' && user.institucion) {
    const datosInstitucion: Partial<Institucion> = {};
    if (nombre_institucion !== undefined) datosInstitucion.nombre_institucion = nombre_institucion;
    if (razon_social !== undefined) datosInstitucion.razon_social = razon_social;
    if (direccion !== undefined) datosInstitucion.direccion = direccion;
    if (Object.keys(datosInstitucion).length > 0) {
      await InstitucionRepository.updateById(user.institucion.id, datosInstitucion);
    }
  }

  const updated = await verUsuario(userId, callerRole);
  return updated;
};
