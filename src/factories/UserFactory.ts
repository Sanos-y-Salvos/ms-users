// Generador de UUIDs para credential_id
import { v4 as uuidv4 } from 'uuid';
// Hashing de contraseñas
import bcrypt from 'bcrypt';
// Entidades y enums
import { User, RolUsuario, TipoUsuario } from '../models/User';
import { Ciudadano } from '../models/Ciudadano';
import { Institucion, TipoInstitucion } from '../models/Institucion';
// Repositorios para persistir
import { UserRepository } from '../repositories/user.repository';
import { CiudadanoRepository } from '../repositories/ciudadano.repository';
import { InstitucionRepository } from '../repositories/institucion.repository';
// Validador de RUN/RUT
import { validarDigitoVerificador } from '../utils/validarDigitoVerificador';

// Datos comunes a cualquier tipo de usuario
export interface DatosBaseUsuario {
  email: string;
  password: string;
  telefono: string;
  region: string;
  comuna: string;
  foto_perfil?: string;
}

// Datos específicos para crear un ciudadano
export interface DatosCiudadano extends DatosBaseUsuario {
  primer_nombre: string;
  segundo_nombre?: string;
  apellido_paterno: string;
  apellido_materno?: string;
  run: string;
  direccion: string;
}

// Datos específicos para crear una institución
export interface DatosInstitucion extends DatosBaseUsuario {
  nombre_institucion: string;
  razon_social: string;
  rut: string;
  tipo_institucion: TipoInstitucion;
  direccion: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Patrón Factory Method (GoF)
//
//   Creator (abstracto):           UserCreator<TDatos, TProducto>
//     - Template method:           crear(datos)        — orquesta el flujo común
//     - Factory Method (abstract): crearProducto(...)  — lo implementan subclases
//     - Hooks (abstract):          obtenerRol / obtenerTipo / validar
//
//   ConcreteCreator → ConcreteProduct:
//     CiudadanoCreator   →  Ciudadano
//     InstitucionCreator →  Institucion
// ─────────────────────────────────────────────────────────────────────────────

export abstract class UserCreator<TDatos extends DatosBaseUsuario, TProducto> {
  // Template Method — define el esqueleto invariante de creación de un usuario.
  // No se sobreescribe; las subclases sólo personalizan los puntos de extensión.
  async crear(datos: TDatos): Promise<{ user: User; entidad: TProducto }> {
    // 1. Validación específica del tipo (hook)
    this.validar(datos);

    // 2. Construcción y persistencia del User base (común a todos los tipos)
    const user = await this.crearUserBase(datos);

    // 3. Factory Method — produce la entidad asociada concreta
    const entidad = await this.crearProducto(user, datos);

    return { user, entidad };
  }

  // Factory Method — cada subclase decide qué entidad producir y cómo persistirla
  protected abstract crearProducto(user: User, datos: TDatos): Promise<TProducto>;

  // Hooks que las subclases deben implementar
  protected abstract obtenerRol(datos: TDatos): RolUsuario;
  protected abstract obtenerTipo(): TipoUsuario;

  // Hook opcional — por defecto no valida nada
  protected validar(_datos: TDatos): void {}

  // Paso común reutilizado por todas las subclases
  private async crearUserBase(datos: TDatos): Promise<User> {
    const credentialId = uuidv4();
    const passwordHash = await bcrypt.hash(datos.password, 10);

    const user = UserRepository.create({
      credential_id: credentialId,
      email: datos.email.toLowerCase(),
      password_hash: passwordHash,
      telefono: datos.telefono,
      region: datos.region,
      comuna: datos.comuna,
      foto_perfil: datos.foto_perfil,
      rol: this.obtenerRol(datos),
      tipo: this.obtenerTipo(),
    });

    try {
      await UserRepository.save(user);
    } catch (e: any) {
      // 23505 = violación de unique constraint en Postgres
      if (e.code === '23505') throw new Error('El correo ya está registrado');
      throw e;
    }
    return user;
  }
}

// ConcreteCreator — produce un Ciudadano
const TELEFONO_CL = /^\+569\d{8}$/;

export class CiudadanoCreator extends UserCreator<DatosCiudadano, Ciudadano> {
  protected validar(datos: DatosCiudadano): void {
    if (!validarDigitoVerificador(datos.run)) throw new Error('RUN inválido');
    if (!TELEFONO_CL.test(datos.telefono)) throw new Error('Teléfono inválido. Formato requerido: +569XXXXXXXX');
  }

  protected obtenerRol(): RolUsuario { return RolUsuario.CIUDADANO; }
  protected obtenerTipo(): TipoUsuario { return TipoUsuario.CIUDADANO; }

  protected async crearProducto(user: User, datos: DatosCiudadano): Promise<Ciudadano> {
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
    return ciudadano;
  }
}

// ConcreteCreator — produce una Institucion
export class InstitucionCreator extends UserCreator<DatosInstitucion, Institucion> {
  protected validar(datos: DatosInstitucion): void {
    if (!validarDigitoVerificador(datos.rut)) throw new Error('RUT inválido');
    if (
      datos.tipo_institucion !== TipoInstitucion.VETERINARIA &&
      datos.tipo_institucion !== TipoInstitucion.MUNICIPALIDAD
    ) {
      throw new Error('Tipo de institución inválido');
    }
    if (!TELEFONO_CL.test(datos.telefono)) throw new Error('Teléfono inválido. Formato requerido: +569XXXXXXXX');
  }

  // El rol depende del subtipo de institución — por eso se resuelve por datos
  protected obtenerRol(datos: DatosInstitucion): RolUsuario {
    return datos.tipo_institucion === TipoInstitucion.VETERINARIA
      ? RolUsuario.VETERINARIA
      : RolUsuario.MUNICIPALIDAD;
  }
  protected obtenerTipo(): TipoUsuario { return TipoUsuario.INSTITUCION; }

  protected async crearProducto(user: User, datos: DatosInstitucion): Promise<Institucion> {
    const institucion = InstitucionRepository.create({
      user,
      nombre_institucion: datos.nombre_institucion,
      razon_social: datos.razon_social,
      rut: datos.rut,
      tipo_institucion: datos.tipo_institucion,
      direccion: datos.direccion,
    });
    await InstitucionRepository.save(institucion);
    return institucion;
  }
}
