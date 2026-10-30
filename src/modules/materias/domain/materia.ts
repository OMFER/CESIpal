import { DatosInvalidosError } from '../../../shared/domain/errores';

// Lo permanente de una materia: se reutiliza en cada semestre a través de sus grupos
export interface Materia {
  id: string;
  nombre: string;
  descripcion?: string;
  totalSemanas: number;
}

export const SEMANAS_POR_DEFECTO = 16;
export const MAXIMO_SEMANAS = 52;

export function validarTotalSemanas(totalSemanas: number): void {
  if (
    !Number.isInteger(totalSemanas) ||
    totalSemanas < 1 ||
    totalSemanas > MAXIMO_SEMANAS
  ) {
    throw new DatosInvalidosError(
      `totalSemanas debe ser un entero entre 1 y ${MAXIMO_SEMANAS}`,
    );
  }
}

export function validarSemanaDeMateria(materia: Materia, semana: number): void {
  if (
    !Number.isInteger(semana) ||
    semana < 1 ||
    semana > materia.totalSemanas
  ) {
    throw new DatosInvalidosError(
      `La semana debe estar entre 1 y ${materia.totalSemanas}`,
    );
  }
}
