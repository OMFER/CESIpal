import {
  ConflictoError,
  DatosInvalidosError,
} from '../../../shared/domain/errores';

export enum EstadoPlan {
  // Se arma libremente; todavía no se puede abrir un grupo con él
  BORRADOR = 'borrador',
  // Los grupos ya lo usan: solo admite correcciones (textos, ligas, redacción de preguntas)
  PUBLICADO = 'publicado',
}

/**
 * Una versión del plan de estudios: sus materias, con el contenido y los exámenes de cada una.
 * Es igual para todos los grupos que la cursan; los alumnos y sus calificaciones viven en el grupo.
 */
export interface Plan {
  id: string;
  // Identifica al plan; sus versiones comparten el nombre
  nombre: string;
  descripcion?: string;
  version: number;
  estado: EstadoPlan;
  publicadoEn?: Date;
}

// Cada materia dura dos semanas; las materias de un mismo bloque se cursan al mismo tiempo
export const SEMANAS_POR_MATERIA = 2;
export const EXAMENES_POR_SEMANA = 2;
export const MAXIMO_BLOQUES = 12;

export const nombreDePlan = ({ nombre, version }: Plan) =>
  `${nombre} (versión ${version})`;

/**
 * Agregar o quitar materias, contenido o exámenes, o mover una materia de bloque, solo se permite
 * en borrador: un grupo que ya empezó nunca ve cambiar la estructura de su plan.
 */
export function validarEstructuraEditable(plan: Plan): void {
  if (plan.estado === EstadoPlan.PUBLICADO) {
    throw new ConflictoError(
      `${nombreDePlan(plan)} ya está publicado: solo admite correcciones. Para cambiar su estructura crea una nueva versión`,
    );
  }
}

export function validarBloque(bloque: number): void {
  if (!Number.isInteger(bloque) || bloque < 1 || bloque > MAXIMO_BLOQUES) {
    throw new DatosInvalidosError(
      `El bloque debe ser un entero entre 1 y ${MAXIMO_BLOQUES}`,
    );
  }
}

// Semana dentro de la materia (1 o 2), no del calendario del grupo
export function validarSemanaDeMateria(semana: number): void {
  if (!Number.isInteger(semana) || semana < 1 || semana > SEMANAS_POR_MATERIA) {
    throw new DatosInvalidosError(
      `La semana de la materia debe estar entre 1 y ${SEMANAS_POR_MATERIA}`,
    );
  }
}
