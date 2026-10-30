const MS_POR_DIA = 24 * 60 * 60 * 1000;
const MS_POR_SEMANA = 7 * MS_POR_DIA;

export type EstadoSemana = 'completada' | 'actual' | 'futura';

export interface SemanaCalendario {
  numero: number;
  inicio: Date;
  fin: Date;
  estado: EstadoSemana;
}

/**
 * Semana del semestre en la que cae `hoy`.
 * Devuelve 0 si el semestre no ha empezado y totalSemanas + 1 si ya terminó.
 */
export function calcularSemanaActual(
  fechaInicio: Date,
  totalSemanas: number,
  hoy: Date,
): number {
  const transcurrido = hoy.getTime() - fechaInicio.getTime();
  if (transcurrido < 0) return 0;
  return Math.min(
    Math.floor(transcurrido / MS_POR_SEMANA) + 1,
    totalSemanas + 1,
  );
}

export function generarSemanas(
  fechaInicio: Date,
  totalSemanas: number,
  hoy: Date,
): SemanaCalendario[] {
  const actual = calcularSemanaActual(fechaInicio, totalSemanas, hoy);

  return Array.from({ length: totalSemanas }, (_, i) => {
    const numero = i + 1;
    const inicio = new Date(fechaInicio.getTime() + i * MS_POR_SEMANA);
    const fin = new Date(inicio.getTime() + MS_POR_SEMANA - MS_POR_DIA);
    const estado: EstadoSemana =
      numero < actual ? 'completada' : numero === actual ? 'actual' : 'futura';
    return { numero, inicio, fin, estado };
  });
}
