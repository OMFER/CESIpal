import { Materia } from './materia';
import { SEMANAS_POR_MATERIA } from './plan';

const MS_POR_DIA = 24 * 60 * 60 * 1000;
const MS_POR_SEMANA = 7 * MS_POR_DIA;

export type EstadoSemana = 'completada' | 'actual' | 'futura';

export interface SemanaCalendario {
  // Semana del grupo (1, 2, 3…)
  numero: number;
  inicio: Date;
  fin: Date;
  estado: EstadoSemana;
  // Bloque de materias que se cursa esa semana y qué semana de esas materias es (1 o 2)
  bloque: number;
  semanaDeMateria: number;
}

export const numeroDeBloques = (materias: Pick<Materia, 'bloque'>[]) =>
  Math.max(0, ...materias.map((m) => m.bloque));

export const totalSemanas = (materias: Pick<Materia, 'bloque'>[]) =>
  numeroDeBloques(materias) * SEMANAS_POR_MATERIA;

// Semana del grupo en la que cae la semana `semanaDeMateria` de una materia del `bloque`
export const semanaDelGrupo = (bloque: number, semanaDeMateria: number) =>
  (bloque - 1) * SEMANAS_POR_MATERIA + semanaDeMateria;

export const inicioDeSemana = (fechaInicio: Date, semana: number) =>
  new Date(fechaInicio.getTime() + (semana - 1) * MS_POR_SEMANA);

/**
 * Semana del grupo en la que cae `hoy`.
 * Devuelve 0 si el grupo no ha empezado y total + 1 si ya terminó.
 */
export function calcularSemanaActual(
  fechaInicio: Date,
  total: number,
  hoy: Date,
): number {
  const transcurrido = hoy.getTime() - fechaInicio.getTime();
  if (transcurrido < 0) return 0;
  return Math.min(Math.floor(transcurrido / MS_POR_SEMANA) + 1, total + 1);
}

export function generarSemanas(
  fechaInicio: Date,
  total: number,
  hoy: Date,
): SemanaCalendario[] {
  const actual = calcularSemanaActual(fechaInicio, total, hoy);

  return Array.from({ length: total }, (_, i) => {
    const numero = i + 1;
    const inicio = inicioDeSemana(fechaInicio, numero);
    const fin = new Date(inicio.getTime() + MS_POR_SEMANA - MS_POR_DIA);
    const estado: EstadoSemana =
      numero < actual ? 'completada' : numero === actual ? 'actual' : 'futura';
    return {
      numero,
      inicio,
      fin,
      estado,
      bloque: Math.floor(i / SEMANAS_POR_MATERIA) + 1,
      semanaDeMateria: (i % SEMANAS_POR_MATERIA) + 1,
    };
  });
}
