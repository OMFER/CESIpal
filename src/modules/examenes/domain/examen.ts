import { Actor, Rol } from '../../../shared/domain/actor';
import {
  DatosInvalidosError,
  SinPermisoError,
} from '../../../shared/domain/errores';

export enum TipoExamen {
  SEMANAL = 'Semanal',
  PARCIAL = 'Parcial',
  FINAL = 'Final',
  PUNTO_EXTRA = 'PuntoExtra',
}

export interface Pregunta {
  id?: string;
  enunciado: string;
  opciones: string[];
  // Índice (base 0) de la opción correcta
  respuestaCorrecta: number;
}

export interface Examen {
  id: string;
  materiaId: string;
  // Semana a la que pertenece; vacío para exámenes que no son semanales
  semana?: number;
  titulo: string;
  descripcion?: string;
  tipo: TipoExamen;
  fechaLimite?: Date;
  puntajeMaximo: number;
  preguntas: Pregunta[];
}

export const PUNTAJE_MAXIMO_POR_DEFECTO = 100;
export const MINIMO_OPCIONES = 2;
export const MAXIMO_OPCIONES = 6;

export function validarPreguntas(preguntas: Pregunta[]): void {
  if (preguntas.length === 0) {
    throw new DatosInvalidosError('El examen necesita al menos una pregunta');
  }
  preguntas.forEach(({ opciones, respuestaCorrecta }, i) => {
    if (
      opciones.length < MINIMO_OPCIONES ||
      opciones.length > MAXIMO_OPCIONES
    ) {
      throw new DatosInvalidosError(
        `Pregunta ${i + 1}: debe tener entre ${MINIMO_OPCIONES} y ${MAXIMO_OPCIONES} opciones`,
      );
    }
    if (
      !Number.isInteger(respuestaCorrecta) ||
      respuestaCorrecta < 0 ||
      respuestaCorrecta >= opciones.length
    ) {
      throw new DatosInvalidosError(
        `Pregunta ${i + 1}: respuestaCorrecta debe ser el índice de una de sus ${opciones.length} opciones`,
      );
    }
  });
}

// Un alumno nunca ve cuál es la respuesta correcta
export function puedeVerRespuestas(actor: Actor): boolean {
  return actor.rol !== Rol.ALUMNO;
}

export function validarQuePuedeResponder(
  examen: Examen,
  respuestas: number[],
  ahora: Date,
): void {
  if (examen.fechaLimite && examen.fechaLimite.getTime() < ahora.getTime()) {
    throw new SinPermisoError('La fecha límite del examen ya pasó');
  }
  if (respuestas.length !== examen.preguntas.length) {
    throw new DatosInvalidosError(
      `Se esperaban ${examen.preguntas.length} respuestas y llegaron ${respuestas.length}`,
    );
  }
}
