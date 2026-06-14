// Entidades y enums
import { User, RolUsuario } from '../models/User';
import { Ciudadano } from '../models/Ciudadano';
import { Institucion, TipoInstitucion } from '../models/Institucion';
// Creators concretos del patrón Factory Method
import { CiudadanoCreator, InstitucionCreator } from '../factories/UserFactory';
// Repositorios
import { UserRepository } from '../repositories/user.repository';
import { CiudadanoRepository } from '../repositories/ciudadano.repository';
import { InstitucionRepository } from '../repositories/institucion.repository';
// Cliente de Cloudinary para subir/eliminar imágenes
import cloudinary from '../config/cloudinary';

// RF-05 — Registro de ciudadano (sube foto opcional y delega al factory)
export const registrarCiudadano = async (datos: any, archivo?: Express.Multer.File) => {
  // URL de la foto subida (si la hay)
  let foto_perfil: string | undefined;

  if (archivo) {
    // Sube la imagen usando upload_stream (buffer en memoria)
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

  // Delega al ConcreteCreator de ciudadano (template method `crear`)
  const { user, entidad } = await new CiudadanoCreator().crear({ ...datos, foto_perfil });
  return { user, ciudadano: entidad };
};

// RF-05 — Registro de institución (idéntico flujo de upload)
export const registrarInstitucion = async (datos: any, archivo?: Express.Multer.File) => {
  let foto_perfil: string | undefined;

  if (archivo) {
    // Sube la imagen a Cloudinary
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

  // Delega al ConcreteCreator de institución (template method `crear`)
  const { user, entidad } = await new InstitucionCreator().crear({
    ...datos,
    foto_perfil,
    tipo_institucion: datos.tipo_institucion as TipoInstitucion,
  });
  return { user, institucion: entidad };
};

// RF-06 — Devuelve el perfil del usuario autenticado con sus relaciones
export const obtenerPerfil = async (credentialId: string) => {
  const user = await UserRepository.findByCredentialId(credentialId, { activeOnly: true, withRelations: true });
  if (!user) throw new Error('Usuario no encontrado');
  return user;
};

// RF-08 — Actualiza datos del usuario y de su entidad relacionada según tipo
export const actualizarPerfil = async (credentialId: string, datos: any, archivo?: Express.Multer.File) => {
  // Busca el usuario con relaciones para saber qué entidad actualizar
  const user = await UserRepository.findByCredentialId(credentialId, { withRelations: true });
  if (!user) throw new Error('Usuario no encontrado');

  // Desestructura todos los posibles campos del body
  const { telefono, region, comuna, primer_nombre, segundo_nombre, apellido_paterno, apellido_materno, direccion, nombre_institucion, razon_social } = datos;

  // Acumula los campos a actualizar en User
  const datosUser: Partial<User> = {};
  if (telefono !== undefined) datosUser.telefono = telefono;
  if (region !== undefined) datosUser.region = region;
  if (comuna !== undefined) datosUser.comuna = comuna;

  // Si llega nueva foto, borra la anterior de Cloudinary y sube la nueva
  if (archivo) {
    if (user.foto_perfil) {
      // Extrae el public_id de la URL para poder eliminar el recurso
      const match = user.foto_perfil.match(/\/upload\/(?:v\d+\/)?(.+)\.[^./]+$/i);
      if (match) await cloudinary.uploader.destroy(match[1]).catch(() => {});
    }
    // Sube la nueva imagen
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

  // Aplica el update solo si hay algo que actualizar
  if (Object.keys(datosUser).length > 0) {
    await UserRepository.updateByCredentialId(credentialId, datosUser);
  }

  // Si es ciudadano, actualiza los campos del Ciudadano
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

  // Si es institución, actualiza los campos de la Institucion
  if (user.tipo === 'institucion' && user.institucion) {
    const datosInstitucion: Partial<Institucion> = {};
    if (nombre_institucion !== undefined) datosInstitucion.nombre_institucion = nombre_institucion;
    if (razon_social !== undefined) datosInstitucion.razon_social = razon_social;
    if (direccion !== undefined) datosInstitucion.direccion = direccion;
    if (Object.keys(datosInstitucion).length > 0) {
      await InstitucionRepository.updateById(user.institucion.id, datosInstitucion);
    }
  }

  // Relee el usuario actualizado con sus relaciones para devolverlo
  const updatedUser = await UserRepository.findByCredentialId(credentialId, { withRelations: true });
  return updatedUser;
};

// RF-10 — Desactiva la cuenta propia (soft delete)
export const desactivarCuenta = async (credentialId: string) => {
  await UserRepository.updateByCredentialId(credentialId, { is_active: false });
};

// Admin — Lista usuarios filtrando por rol y estado; oculta superadmin a no-superadmins
export const listarUsuarios = async (filtros?: { rol?: string; is_active?: boolean }, callerRole?: string) => {
  // Construye el where dinámicamente
  const where: any = {};
  if (filtros?.rol) where.rol = filtros.rol;
  if (filtros?.is_active !== undefined) where.is_active = filtros.is_active;

  // Consulta la lista
  const users = await UserRepository.findAll(where);

  // Filtra superadmin si quien consulta no es superadmin
  if (callerRole !== 'superadmin') {
    return users.filter(u => u.rol !== RolUsuario.SUPERADMIN);
  }
  return users;
};

// Admin — Ver un usuario por id; bloquea ver superadmin a no-superadmins
export const verUsuario = async (userId: string, callerRole?: string) => {
  const user = await UserRepository.findById(userId, { withRelations: true });
  if (!user) throw new Error('Usuario no encontrado');
  // Acceso denegado si intentan ver un superadmin sin serlo
  if (callerRole !== undefined && callerRole !== 'superadmin' && user.rol === RolUsuario.SUPERADMIN) {
    const err: any = new Error('Acceso denegado');
    err.status = 403;
    throw err;
  }
  return user;
};

// Admin — Cambia activo/inactivo de un usuario
export const cambiarEstadoUsuario = async (userId: string, is_active: boolean, callerRole?: string) => {
  // Reutiliza verUsuario para validar existencia y permisos
  const user = await verUsuario(userId, callerRole);
  await UserRepository.updateById(userId, { is_active });
  // Refresca el campo en la respuesta sin volver a leer
  user.is_active = is_active;
  return user;
};

// Admin — Cambia el rol; valida que sea un rol soportado
export const cambiarRolUsuario = async (userId: string, rol: string, callerRole?: string) => {
  // Valida que el rol esté en el enum
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

// Admin — Edita datos de un usuario (sin foto); mismas reglas que actualizarPerfil
export const editarDatosUsuario = async (userId: string, datos: any, callerRole?: string) => {
  // Verifica existencia y permisos
  const user = await verUsuario(userId, callerRole);

  // Desestructura los campos editables
  const { telefono, region, comuna, primer_nombre, segundo_nombre, apellido_paterno, apellido_materno, direccion, nombre_institucion, razon_social } = datos;

  // Update parcial sobre User
  const datosUser: Partial<User> = {};
  if (telefono !== undefined) datosUser.telefono = telefono;
  if (region !== undefined) datosUser.region = region;
  if (comuna !== undefined) datosUser.comuna = comuna;
  if (Object.keys(datosUser).length > 0) {
    await UserRepository.updateById(userId, datosUser);
  }

  // Update parcial sobre Ciudadano si aplica
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

  // Update parcial sobre Institucion si aplica
  if (user.tipo === 'institucion' && user.institucion) {
    const datosInstitucion: Partial<Institucion> = {};
    if (nombre_institucion !== undefined) datosInstitucion.nombre_institucion = nombre_institucion;
    if (razon_social !== undefined) datosInstitucion.razon_social = razon_social;
    if (direccion !== undefined) datosInstitucion.direccion = direccion;
    if (Object.keys(datosInstitucion).length > 0) {
      await InstitucionRepository.updateById(user.institucion.id, datosInstitucion);
    }
  }

  // Devuelve el usuario refrescado
  const updated = await verUsuario(userId, callerRole);
  return updated;
};
