import { Actor, Rol } from '../../../shared/domain/actor';
import { DatosInvalidosError } from '../../../shared/domain/errores';
import {
  EXAMENES_POR_SEMANA,
  validarSemanaDeMateria,
} from '../../planes/domain/plan';

export interface Pregunta {
  id?: string;
  enunciado: string;
  opciones: string[];
  // Índice (base 0) de la opción correcta
  respuestaCorrecta: number;
}

// Pertenece a la materia: lo presentan todos los grupos que cursan su plan, cada uno con sus fechas
export interface Examen {
  id: string;
  materiaId: string;
  // Semana de la materia (1 o 2)
  semana: number;
  // Primer o segundo examen de la semana; los dos cuentan para la calificación
  numero: number;
  titulo: string;
  descripcion?: string;
  // Días de prórroga sobre la ventana normal del examen
  diasExtra: number;
  preguntas: Pregunta[];
}

export const MAXIMO_DIAS_EXTRA = 30;
export const MINIMO_OPCIONES = 2;
export const MAXIMO_OPCIONES = 6;

export const tituloPorDefecto = (semana: number, numero: number) =>
  `Semana ${semana} · Examen ${numero}`;

export function validarSemanaYNumero(semana: number, numero: number): void {
  validarSemanaDeMateria(semana);
  if (!Number.isInteger(numero) || numero < 1 || numero > EXAMENES_POR_SEMANA) {
    throw new DatosInvalidosError(
      `El número de examen debe estar entre 1 y ${EXAMENES_POR_SEMANA}`,
    );
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

// Problemas de una pregunta, sin lanzar: la importación junta los de todas las filas
export function problemasDePregunta({
  enunciado,
  opciones,
  respuestaCorrecta,
}: Pregunta): string[] {
  const problemas: string[] = [];
  if (!enunciado.trim()) problemas.push('le falta el enunciado');
  if (opciones.length < MINIMO_OPCIONES || opciones.length > MAXIMO_OPCIONES) {
    problemas.push(
      `debe tener entre ${MINIMO_OPCIONES} y ${MAXIMO_OPCIONES} opciones`,
    );
  }
  if (opciones.some((o) => !o.trim())) {
    problemas.push('tiene opciones vacías');
  }
  if (
    !Number.isInteger(respuestaCorrecta) ||
    respuestaCorrecta < 0 ||
    respuestaCorrecta >= opciones.length
  ) {
    problemas.push(
      `la respuesta correcta debe ser una de sus ${opciones.length} opciones`,
    );
  }
  return problemas;
}

export function validarPreguntas(preguntas: Pregunta[]): void {
  if (preguntas.length === 0) {
    throw new DatosInvalidosError('El examen necesita al menos una pregunta');
  }
  const errores = preguntas.flatMap((p, i) =>
    problemasDePregunta(p).map((problema) => `Pregunta ${i + 1}: ${problema}`),
  );
  if (errores.length) {
    throw new DatosInvalidosError(errores[0], errores);
  }
}

/**
 * Cuando ya hay alumnos que respondieron, solo se acepta corregir la redacción:
 * mismas preguntas, mismo número de opciones y la misma respuesta correcta.
 * Así ninguna calificación guardada deja de corresponder a su examen.
 */
export function esCorreccionDeTexto(
  antes: Pregunta[],
  despues: Pregunta[],
): boolean {
  return (
    antes.length === despues.length &&
    antes.every(
      (p, i) =>
        p.opciones.length === despues[i].opciones.length &&
        p.respuestaCorrecta === despues[i].respuestaCorrecta,
    )
  );
}

// Antes de responder, un alumno nunca ve cuál es la respuesta correcta
export function puedeVerRespuestas(actor: Actor): boolean {
  return actor.rol !== Rol.ALUMNO;
}

// Por semana y, dentro de ella, el examen 1 antes que el 2
export const ordenarExamenes = (examenes: Examen[]): Examen[] =>
  [...examenes].sort((a, b) => a.semana - b.semana || a.numero - b.numero);
