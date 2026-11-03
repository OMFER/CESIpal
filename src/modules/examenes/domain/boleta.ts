import { Examen, TipoExamen } from './examen';
import { Intento } from './intento';

export interface Nota {
  calificacion: number;
  puntajeMaximo: number;
}

export interface NotaDeSemana {
  semana: number;
  semanal: Nota | null;
  reposicion: Nota | null;
  // La mejor de las dos, comparada en porcentaje
  mejor: Nota | null;
}

export interface Boleta {
  semanas: NotaDeSemana[];
  final: Nota | null;
  // Calificación que lleva el alumno en el semestre, sobre ESCALA_SEMESTRE
  semestre: number;
}

export const ESCALA_SEMESTRE = 10;

const porcentaje = (nota: Nota) =>
  nota.puntajeMaximo === 0 ? 0 : nota.calificacion / nota.puntajeMaximo;

/**
 * El 10 del semestre se reparte en partes iguales entre cada semana de la materia y el Final
 * (totalSemanas + 1 partes), tengan o no examen creado: lo que no se ha presentado cuenta 0.
 * Cada semana aporta su mejor nota (Semanal o Reposición) en porcentaje.
 */
export function calificacionDelSemestre(
  semanas: NotaDeSemana[],
  final: Nota | null,
  totalSemanas: number,
): number {
  const partes = totalSemanas + 1;
  const sumaSemanas = semanas
    .filter((s) => s.semana >= 1 && s.semana <= totalSemanas)
    .reduce((suma, s) => suma + (s.mejor ? porcentaje(s.mejor) : 0), 0);
  const total = sumaSemanas + (final ? porcentaje(final) : 0);
  return Math.round((total / partes) * ESCALA_SEMESTRE * 10) / 10;
}

function mejorNota(a: Nota | null, b: Nota | null): Nota | null {
  if (!a || !b) return a ?? b;
  return porcentaje(b) > porcentaje(a) ? b : a;
}

// Calificaciones de un alumno en un grupo: una fila por cada semana que tiene examen Semanal
export function construirBoleta(
  examenes: Examen[],
  intentosDelAlumno: Intento[],
  totalSemanas: number,
): Boleta {
  const notaDe = (examen?: Examen): Nota | null => {
    const intento =
      examen && intentosDelAlumno.find((i) => i.examenId === examen.id);
    return examen && intento
      ? {
          calificacion: intento.calificacion,
          puntajeMaximo: examen.puntajeMaximo,
        }
      : null;
  };
  const delTipo = (tipo: TipoExamen, semana?: number) =>
    examenes.find((e) => e.tipo === tipo && e.semana === semana);

  const semanas = examenes
    .filter((e) => e.tipo === TipoExamen.SEMANAL && e.semana !== undefined)
    .map((e) => e.semana as number)
    .sort((a, b) => a - b)
    .map((semana) => {
      const semanal = notaDe(delTipo(TipoExamen.SEMANAL, semana));
      const reposicion = notaDe(delTipo(TipoExamen.REPOSICION, semana));
      return {
        semana,
        semanal,
        reposicion,
        mejor: mejorNota(semanal, reposicion),
      };
    });

  const final = notaDe(delTipo(TipoExamen.FINAL));
  return {
    semanas,
    final,
    semestre: calificacionDelSemestre(semanas, final, totalSemanas),
  };
}
