import {
  DatosInvalidosError,
  SinPermisoError,
} from '../../../shared/domain/errores';
import { formatearFecha } from '../../../shared/domain/fechas';
import { Examen } from './examen';

const MS_POR_DIA = 24 * 60 * 60 * 1000;
const DIAS_POR_SEMANA = 7;

/**
 * Día de la semana (contando desde el lunes = 0) en que abre cada examen.
 * Examen 1: de lunes a domingo. Examen 2: de jueves a domingo.
 */
export const DIA_DE_APERTURA: Record<number, number> = { 1: 0, 2: 3 };

export type EstadoVentana = 'proxima' | 'abierta' | 'cerrada';

export interface Ventana {
  abre: Date;
  cierra: Date;
  estado: EstadoVentana;
}

const masDias = (fecha: Date, dias: number) =>
  new Date(fecha.getTime() + dias * MS_POR_DIA);

/**
 * Cuándo puede responderse un examen en un grupo. `inicioDeSemana` es el lunes de la semana
 * del grupo en la que cae la semana del examen. Los dos cierran al terminar el domingo (+ diasExtra).
 */
export function calcularVentana(
  examen: Pick<Examen, 'numero' | 'diasExtra'>,
  inicioDeSemana: Date,
  ahora: Date,
): Ventana {
  const abre = masDias(inicioDeSemana, DIA_DE_APERTURA[examen.numero] ?? 0);
  const cierra = masDias(inicioDeSemana, DIAS_POR_SEMANA + examen.diasExtra);
  const estado: EstadoVentana =
    ahora < abre ? 'proxima' : ahora < cierra ? 'abierta' : 'cerrada';
  return { abre, cierra, estado };
}

export function validarQuePuedeResponder(
  examen: Pick<Examen, 'preguntas'>,
  ventana: Ventana,
  respuestas: number[],
  zonaHoraria = 'UTC',
): void {
  if (ventana.estado === 'proxima') {
    throw new SinPermisoError(
      `El examen abre el ${formatearFecha(ventana.abre, zonaHoraria)}`,
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
  const fueraDeRango = respuestas.findIndex(
    (r, i) => r >= examen.preguntas[i].opciones.length,
  );
  if (fueraDeRango !== -1) {
    throw new DatosInvalidosError(
      `La respuesta de la pregunta ${fueraDeRango + 1} no es una de sus opciones`,
    );
  }
}

// La clave de respuestas se revela hasta que nadie del grupo puede responder ya
export function puedeRevelarRespuestas(ventana: Ventana): boolean {
  return ventana.estado === 'cerrada';
}
