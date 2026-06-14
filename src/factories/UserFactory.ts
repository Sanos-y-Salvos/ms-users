// Generador de UUIDs para credential_id
import { v4 as uuidv4 } from 'uuid';
// Hashing de contraseñas
import bcrypt from 'bcrypt';
// Enums de rol y tipo
import { RolUsuario, TipoUsuario } from '../models/User';
// Tipos de institución
import { TipoInstitucion } from '../models/Institucion';
// Repositorios para persistir
import { UserRepository } from '../repositories/user.repository';
import { CiudadanoRepository } from '../repositories/ciudadano.repository';
import { InstitucionRepository } from '../repositories/institucion.repository';
// Validador de RUN/RUT
import { validarDigitoVerificador } from '../utils/validarDigitoVerificador';

// Factory Method — encapsula la creación de User + entidad específica según tipo
export const UserFactory = {

  // Crea un User de tipo ciudadano junto con sus datos personales
  async crearCiudadano(datos: {
    email: string;
    password: string;
    telefono: string;
    region: string;
    comuna: string;
    primer_nombre: string;
    segundo_nombre?: string;
    apellido_paterno: string;
    apellido_materno?: string;
    run: string;
    direccion: string;
    foto_perfil?: string;
  }) {
    // Validación de RUN antes de cualquier persistencia
    if (!validarDigitoVerificador(datos.run)) throw new Error('RUN inválido');

    // Identificador de credencial y hash de contraseña
    const credentialId = uuidv4();
    const passwordHash = await bcrypt.hash(datos.password, 10);

    // Construye el User base
    const user = UserRepository.create({
      credential_id: credentialId,
      email: datos.email.toLowerCase(),
      password_hash: passwordHash,
      telefono: datos.telefono,
      region: datos.region,
      comuna: datos.comuna,
      foto_perfil: datos.foto_perfil,
      rol: RolUsuario.CIUDADANO,
      tipo: TipoUsuario.CIUDADANO,
    });

    try {
      // Persiste el User; si choca el unique de email, lanza mensaje claro
      await UserRepository.save(user);
    } catch (e: any) {
      // 23505 = violación de unique constraint en Postgres
      if (e.code === '23505') throw new Error('El correo ya está registrado');
      throw e;
    }

    // Construye y persiste el Ciudadano asociado
    const ciudadano = CiudadanoRepository.create({
      user,
      primer_nombre: datos.primer_nombre,
      segundo_nombre: datos.segundo_nombre,
      apellido_paterno: datos.apellido_paterno,
      apellido_materno: datos.apellido_materno,
      run: datos.run,
      direccion: datos.direccion,
    });
    await CiudadanoRepository.save(ciudadano);

    // Devuelve ambas entidades al llamador
    return { user, ciudadano };
  },

  // Crea un User de tipo institución junto con sus datos organizacionales
  async crearInstitucion(datos: {
    email: string;
    password: string;
    telefono: string;
    region: string;
    comuna: string;
    nombre_institucion: string;
    razon_social: string;
    rut: string;
    tipo_institucion: TipoInstitucion;
    direccion: string;
    foto_perfil?: string;
  }) {
    // Valida RUT antes de persistir
    if (!validarDigitoVerificador(datos.rut)) throw new Error('RUT inválido');

    // Garantiza que el tipo sea uno de los soportados
    if (datos.tipo_institucion !== TipoInstitucion.VETERINARIA && datos.tipo_institucion !== TipoInstitucion.MUNICIPALIDAD) {
      throw new Error('Tipo de institución inválido');
    }

    // Mapea tipo de institución a rol concreto
    const rol = datos.tipo_institucion === TipoInstitucion.VETERINARIA
      ? RolUsuario.VETERINARIA
      : RolUsuario.MUNICIPALIDAD;

    // Identificador de credencial y hash
    const credentialId = uuidv4();
    const passwordHash = await bcrypt.hash(datos.password, 10);

    // Construye el User base con rol institucional
    const user = UserRepository.create({
      credential_id: credentialId,
      email: datos.email.toLowerCase(),
      password_hash: passwordHash,
      telefono: datos.telefono,
      region: datos.region,
      comuna: datos.comuna,
      foto_perfil: datos.foto_perfil,
      rol,
      tipo: TipoUsuario.INSTITUCION,
    });

    try {
      // Persiste el User; mismo manejo de email duplicado
      await UserRepository.save(user);
    } catch (e: any) {
      if (e.code === '23505') throw new Error('El correo ya está registrado');
      throw e;
    }

    // Construye y persiste la Institucion asociada
    const institucion = InstitucionRepository.create({
      user,
      nombre_institucion: datos.nombre_institucion,
      razon_social: datos.razon_social,
      rut: datos.rut,
      tipo_institucion: datos.tipo_institucion,
      direccion: datos.direccion,
    });
    await InstitucionRepository.save(institucion);

    // Devuelve ambas entidades
    return { user, institucion };
  },
};
