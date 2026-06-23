// Tipos Request/Response de Express
import { Request, Response } from 'express';
// Servicios de usuario
import * as UserService from '../services/user.service';
// Helpers de respuesta estándar
import { successResponse, errorResponse } from '../utils/response';
// Request extendido con usuario autenticado
import { AuthRequest } from '../middlewares/verifyToken';
// Validadores reutilizables
import { esNombreValido, esEmailValido, esTelefonoValido, normalizarYValidarRut } from '../utils/validators';

// RF-05 — Registro de ciudadano (con validaciones de formato)
export const registrarCiudadano = async (req: Request, res: Response): Promise<void> => {
  try {
    // Desestructura todos los campos esperados del body
    const { email, password, telefono, region, comuna, primer_nombre, segundo_nombre, apellido_paterno, apellido_materno, run, direccion } = req.body;

    // Validación de presencia de campos obligatorios
    if (!email || !password || !telefono || !region || !comuna || !primer_nombre || !apellido_paterno || !run || !direccion) {
      errorResponse(res, 'Faltan campos requeridos: email, password, telefono, region, comuna, primer_nombre, apellido_paterno, run, direccion');
      return;
    }
    // Validaciones de formato campo por campo
    if (!esEmailValido(email)) { errorResponse(res, 'Email inválido'); return; }
    if (password.length < 6) { errorResponse(res, 'La contraseña debe tener al menos 6 caracteres'); return; }
    if (!esTelefonoValido(telefono)) { errorResponse(res, 'Teléfono inválido: solo números, con + opcional al inicio'); return; }
    if (!esNombreValido(primer_nombre)) { errorResponse(res, 'El primer nombre debe tener al menos 3 letras y no contener números ni símbolos'); return; }
    if (segundo_nombre && !esNombreValido(segundo_nombre)) { errorResponse(res, 'El segundo nombre debe tener al menos 3 letras y no contener números ni símbolos'); return; }
    if (!esNombreValido(apellido_paterno)) { errorResponse(res, 'El apellido paterno debe tener al menos 3 letras y no contener números ni símbolos'); return; }
    if (apellido_materno && !esNombreValido(apellido_materno)) { errorResponse(res, 'El apellido materno debe tener al menos 3 letras y no contener números ni símbolos'); return; }

    // Normaliza y valida el RUN
    const runValidado = normalizarYValidarRut(run);
    if (!runValidado.valido) { errorResponse(res, 'RUN inválido'); return; }

    // Delega al servicio, reemplazando el RUN por su forma normalizada
    const data = await UserService.registrarCiudadano(
      { ...req.body, run: runValidado.normalizado },
      req.file
    );
    successResponse(res, data, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
};

// RF-05 — Registro de institución
export const registrarInstitucion = async (req: Request, res: Response): Promise<void> => {
  try {
    // Desestructura campos esperados
    const { email, password, telefono, region, comuna, nombre_institucion, razon_social, rut, tipo_institucion, direccion } = req.body;

    // Validación de presencia de obligatorios
    if (!email || !password || !telefono || !region || !comuna || !nombre_institucion || !razon_social || !rut || !tipo_institucion || !direccion) {
      errorResponse(res, 'Faltan campos requeridos: email, password, telefono, region, comuna, nombre_institucion, razon_social, rut, tipo_institucion, direccion');
      return;
    }
    // Validaciones de formato
    if (!esEmailValido(email)) { errorResponse(res, 'Email inválido'); return; }
    if (password.length < 6) { errorResponse(res, 'La contraseña debe tener al menos 6 caracteres'); return; }
    if (!esTelefonoValido(telefono)) { errorResponse(res, 'Teléfono inválido: solo números, con + opcional al inicio'); return; }
    if (!esNombreValido(nombre_institucion)) { errorResponse(res, 'El nombre de institución debe tener al menos 3 letras y no contener números ni símbolos'); return; }
    if (!esNombreValido(razon_social)) { errorResponse(res, 'La razón social debe tener al menos 3 letras y no contener números ni símbolos'); return; }

    // Normaliza y valida el RUT
    const rutValidado = normalizarYValidarRut(rut);
    if (!rutValidado.valido) { errorResponse(res, 'RUT inválido'); return; }

    // Delega al servicio
    const data = await UserService.registrarInstitucion(
      { ...req.body, rut: rutValidado.normalizado },
      req.file
    );
    successResponse(res, data, 201);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
};

// RF-06 — Ver perfil propio
export const obtenerPerfil = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Usa el id del usuario autenticado
    const userId = req.user!.id;
    const data = await UserService.obtenerPerfil(userId);
    successResponse(res, data);
  } catch (err: any) {
    // 404 si no se encontró
    errorResponse(res, err.message, 404);
  }
};

// RF-08 — Actualizar perfil propio (con foto opcional)
export const actualizarPerfil = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Solo se validan los campos que llegan (todos opcionales)
    const { telefono, primer_nombre, segundo_nombre, apellido_paterno, apellido_materno, nombre_institucion, razon_social } = req.body;

    // Validaciones condicionales por campo presente
    if (telefono !== undefined && !esTelefonoValido(telefono)) { errorResponse(res, 'Teléfono inválido: solo números, con + opcional al inicio'); return; }
    if (primer_nombre !== undefined && !esNombreValido(primer_nombre)) { errorResponse(res, 'El primer nombre debe tener al menos 3 letras y no contener números ni símbolos'); return; }
    if (segundo_nombre !== undefined && segundo_nombre !== '' && !esNombreValido(segundo_nombre)) { errorResponse(res, 'El segundo nombre debe tener al menos 3 letras y no contener números ni símbolos'); return; }
    if (apellido_paterno !== undefined && !esNombreValido(apellido_paterno)) { errorResponse(res, 'El apellido paterno debe tener al menos 3 letras y no contener números ni símbolos'); return; }
    if (apellido_materno !== undefined && apellido_materno !== '' && !esNombreValido(apellido_materno)) { errorResponse(res, 'El apellido materno debe tener al menos 3 letras y no contener números ni símbolos'); return; }
    if (nombre_institucion !== undefined && !esNombreValido(nombre_institucion)) { errorResponse(res, 'El nombre de institución debe tener al menos 3 letras y no contener números ni símbolos'); return; }
    if (razon_social !== undefined && !esNombreValido(razon_social)) { errorResponse(res, 'La razón social debe tener al menos 3 letras y no contener números ni símbolos'); return; }

    // Delega al servicio con el archivo subido (si lo hay)
    const userId = req.user!.id;
    const data = await UserService.actualizarPerfil(userId, req.body, req.file);
    successResponse(res, data!);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
};

// RF-10 — Desactiva la cuenta del usuario autenticado
export const desactivarCuenta = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    await UserService.desactivarCuenta(userId);
    successResponse(res, { message: 'Cuenta desactivada correctamente' });
  } catch (err: any) {
    errorResponse(res, err.message);
  }
};

// Admin — Lista usuarios con filtros opcionales por rol y estado
export const listarUsuarios = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Toma filtros de query string
    const { rol, is_active } = req.query;
    // Convierte is_active de string a boolean si llega
    const data = await UserService.listarUsuarios(
      { rol: rol as string, is_active: is_active !== undefined ? is_active === 'true' : undefined },
      req.user!.role,
    );
    successResponse(res, data);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
};

// Admin — Ver un usuario por id
export const verUsuario = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = await UserService.verUsuario(id, req.user!.role);
    successResponse(res, data);
  } catch (err: any) {
    // 404 por defecto si el error no trae status (ej: no encontrado)
    errorResponse(res, err.message, err.status ?? 404);
  }
};

// Admin — Cambia el estado activo/inactivo de un usuario
export const cambiarEstadoUsuario = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { is_active } = req.body;
    const data = await UserService.cambiarEstadoUsuario(id, is_active, req.user!.role);
    successResponse(res, data);
  } catch (err: any) {
    errorResponse(res, err.message, err.status ?? 400);
  }
};

// Admin — Cambia el rol de un usuario
export const cambiarRolUsuario = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { rol } = req.body;
    const data = await UserService.cambiarRolUsuario(id, rol, req.user!.role);
    successResponse(res, data);
  } catch (err: any) {
    errorResponse(res, err.message, err.status ?? 400);
  }
};

// Admin — Estadísticas para el dashboard
export const getEstadisticas = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await UserService.getEstadisticas();
    successResponse(res, data);
  } catch (err: any) {
    errorResponse(res, err.message);
  }
};

// Admin — Edita datos de un usuario (sin foto)
export const editarDatosUsuario = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Solo se validan los campos presentes
    const { telefono, primer_nombre, segundo_nombre, apellido_paterno, apellido_materno, nombre_institucion, razon_social } = req.body;

    // Validaciones condicionales por campo
    if (telefono !== undefined && !esTelefonoValido(telefono)) { errorResponse(res, 'Teléfono inválido: solo números, con + opcional al inicio'); return; }
    if (primer_nombre !== undefined && !esNombreValido(primer_nombre)) { errorResponse(res, 'El primer nombre debe tener al menos 3 letras y no contener números ni símbolos'); return; }
    if (segundo_nombre !== undefined && segundo_nombre !== '' && !esNombreValido(segundo_nombre)) { errorResponse(res, 'El segundo nombre debe tener al menos 3 letras y no contener números ni símbolos'); return; }
    if (apellido_paterno !== undefined && !esNombreValido(apellido_paterno)) { errorResponse(res, 'El apellido paterno debe tener al menos 3 letras y no contener números ni símbolos'); return; }
    if (apellido_materno !== undefined && apellido_materno !== '' && !esNombreValido(apellido_materno)) { errorResponse(res, 'El apellido materno debe tener al menos 3 letras y no contener números ni símbolos'); return; }
    if (nombre_institucion !== undefined && !esNombreValido(nombre_institucion)) { errorResponse(res, 'El nombre de institución debe tener al menos 3 letras y no contener números ni símbolos'); return; }
    if (razon_social !== undefined && !esNombreValido(razon_social)) { errorResponse(res, 'La razón social debe tener al menos 3 letras y no contener números ni símbolos'); return; }

    // Delega al servicio
    const id = req.params.id as string;
    const data = await UserService.editarDatosUsuario(id, req.body, req.user!.role);
    successResponse(res, data);
  } catch (err: any) {
    errorResponse(res, err.message, err.status ?? 400);
  }
};
