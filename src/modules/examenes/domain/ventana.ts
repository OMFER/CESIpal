import {
  DatosInvalidosError,
  SinPermisoError,
} from '../../../shared/domain/errores';
import { Examen, TipoExamen } from './examen';

const MS_POR_DIA = 24 * 60 * 60 * 1000;
const DIAS_POR_SEMANA = 7;

export type EstadoVentana = 'proxima' | 'abierta' | 'cerrada';

export interface Ventana {
  abre: Date;
  cierra: Date;
  estado: EstadoVentana;
}

export interface CalendarioDelGrupo {
  fechaInicio: Date;
  totalSemanas: number;
}

const masDias = (fecha: Date, dias: number) =>
  new Date(fecha.getTime() + dias * MS_POR_DIA);

/**
 * Cuándo puede responderse un examen en un grupo:
 * - Semanal n: durante la semana n (+ diasExtra).
 * - Reposición n: los 7 días (+ diasExtra) que siguen al cierre del Semanal n.
 * - Final: los 7 días (+ diasExtra) que siguen al fin del semestre.
 * `diasExtraDelSemanal` solo importa para la Reposición, que abre cuando cierra el Semanal.
 */
export function calcularVentana(
  examen: Pick<Examen, 'tipo' | 'semana' | 'diasExtra'>,
  { fechaInicio, totalSemanas }: CalendarioDelGrupo,
  ahora: Date,
  diasExtraDelSemanal = 0,
): Ventana {
  const inicioDeSemana = (n: number) =>
    masDias(fechaInicio, (n - 1) * DIAS_POR_SEMANA);
  const semana = examen.semana ?? totalSemanas + 1;

  let abre: Date;
  let cierra: Date;
  switch (examen.tipo) {
    case TipoExamen.SEMANAL:
      abre = inicioDeSemana(semana);
      cierra = masDias(inicioDeSemana(semana + 1), examen.diasExtra);
      break;
    case TipoExamen.REPOSICION:
      abre = masDias(inicioDeSemana(semana + 1), diasExtraDelSemanal);
      cierra = masDias(abre, DIAS_POR_SEMANA + examen.diasExtra);
      break;
    case TipoExamen.FINAL:
      abre = inicioDeSemana(totalSemanas + 1);
      cierra = masDias(abre, DIAS_POR_SEMANA + examen.diasExtra);
      break;
  }

  const estado: EstadoVentana =
    ahora < abre ? 'proxima' : ahora < cierra ? 'abierta' : 'cerrada';
  return { abre, cierra, estado };
}

const formatoFecha = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function validarQuePuedeResponder(
  examen: Pick<Examen, 'preguntas'>,
  ventana: Ventana,
  respuestas: number[],
): void {
  if (ventana.estado === 'proxima') {
    throw new SinPermisoError(
      `El examen abre el ${formatoFecha.format(ventana.abre)}`,
    );
  }
  if (ventana.estado === 'cerrada') {
    throw new SinPermisoError('El examen ya cerró');
  }
  if (respuestas.length !== examen.preguntas.length) {
    throw new DatosInvalidosError(
      `Se esperaban ${examen.preguntas.length} respuestas y llegaron ${respuestas.length}`,
    );
  }
}
