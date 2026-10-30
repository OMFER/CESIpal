import { Actor, Rol } from '../../../shared/domain/actor';
import { DatosInvalidosError } from '../../../shared/domain/errores';

export enum TipoExamen {
  SEMANAL = 'Semanal',
  // Segunda oportunidad de la semana: para aprobar o subir la calificación
  REPOSICION = 'Reposicion',
  // Uno por materia, al terminar el semestre
  FINAL = 'Final',
}

export interface Pregunta {
  id?: string;
  enunciado: string;
  opciones: string[];
  // Índice (base 0) de la opción correcta
  respuestaCorrecta: number;
}

// Pertenece a la materia: lo usan todos sus grupos, cada uno con sus propias fechas
export interface Examen {
  id: string;
  materiaId: string;
  tipo: TipoExamen;
  // Obligatoria en Semanal y Reposición; no existe en el Final
  semana?: number;
  titulo: string;
  descripcion?: string;
  puntajeMaximo: number;
  // Días de prórroga sobre la ventana normal del examen
  diasExtra: number;
  preguntas: Pregunta[];
}

export const PUNTAJE_MAXIMO_POR_DEFECTO = 100;
export const MAXIMO_DIAS_EXTRA = 30;
export const MINIMO_OPCIONES = 2;
export const MAXIMO_OPCIONES = 6;

export function validarTipoYSemana(tipo: TipoExamen, semana?: number): void {
  if (tipo === TipoExamen.FINAL && semana !== undefined) {
    throw new DatosInvalidosError('El examen final no pertenece a una semana');
  }
  if (tipo !== TipoExamen.FINAL && semana === undefined) {
    throw new DatosInvalidosError(`El examen ${tipo} necesita una semana`);
  }
}

export function validarDiasExtra(diasExtra: number): void {
  if (
    !Number.isInteger(diasExtra) ||
    diasExtra < 0 ||
    diasExtra > MAXIMO_DIAS_EXTRA
  ) {
    throw new DatosInvalidosError(
      `diasExtra debe ser un entero entre 0 y ${MAXIMO_DIAS_EXTRA}`,
    );
  }
}

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

// Antes de responder, un alumno nunca ve cuál es la respuesta correcta
export function puedeVerRespuestas(actor: Actor): boolean {
  return actor.rol !== Rol.ALUMNO;
}
