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
}

const porcentaje = (nota: Nota) =>
  nota.puntajeMaximo === 0 ? 0 : nota.calificacion / nota.puntajeMaximo;

function mejorNota(a: Nota | null, b: Nota | null): Nota | null {
  if (!a || !b) return a ?? b;
  return porcentaje(b) > porcentaje(a) ? b : a;
}

// Calificaciones de un alumno en un grupo: una fila por cada semana que tiene examen Semanal
export function construirBoleta(
  examenes: Examen[],
  intentosDelAlumno: Intento[],
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

  return { semanas, final: notaDe(delTipo(TipoExamen.FINAL)) };
}
