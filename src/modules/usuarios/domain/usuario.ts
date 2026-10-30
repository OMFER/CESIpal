import { Rol } from '../../../shared/domain/actor';
import { DatosInvalidosError } from '../../../shared/domain/errores';

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  // Materias en las que está inscrito (solo alumnos)
  materiaIds: string[];
}

export const LONGITUD_MINIMA_PASSWORD = 6;

export function normalizarCorreo(correo: string): string {
  return correo.trim().toLowerCase();
}

export function validarPassword(password: string): void {
  if (password.length < LONGITUD_MINIMA_PASSWORD) {
    throw new DatosInvalidosError(
      `La contraseña debe tener al menos ${LONGITUD_MINIMA_PASSWORD} caracteres`,
    );
  }
}
