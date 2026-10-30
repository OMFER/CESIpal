import { DatosInvalidosError } from './errores';

export const ZONA_HORARIA_POR_DEFECTO = 'America/Mexico_City';

const FECHA = /^(\d{4})-(\d{2})-(\d{2})/;

export function esZonaHorariaValida(zona: string): boolean {
  try {
    new Intl.DateTimeFormat('es', { timeZone: zona });
    return true;
  } catch {
    return false;
  }
}

// Cuántos milisegundos va la hora local de `zona` adelante (o atrás) de UTC en ese instante
function desfaseDe(zona: string, instante: number): number {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: zona,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(new Date(instante))
      .map((p) => [p.type, Number(p.value)]),
  );
  const comoUtc = Date.UTC(
    partes.year,
    partes.month - 1,
    partes.day,
    partes.hour,
    partes.minute,
    partes.second,
  );
  return comoUtc - Math.floor(instante / 1000) * 1000;
}

/**
 * Medianoche de `fecha` (YYYY-MM-DD) en la zona horaria de la escuela.
 * Así las semanas y los exámenes abren a las 00:00 locales y no a las 00:00 UTC.
 */
export function inicioDelDia(fecha: string, zona: string): Date {
  const partes = FECHA.exec(fecha);
  if (!partes) {
    throw new DatosInvalidosError(`"${fecha}" no es una fecha YYYY-MM-DD`);
  }
  const medianocheUtc = Date.UTC(
    Number(partes[1]),
    Number(partes[2]) - 1,
    Number(partes[3]),
  );
  // Se corrige dos veces por si ese día cambia el horario de verano
  let instante = medianocheUtc - desfaseDe(zona, medianocheUtc);
  instante = medianocheUtc - desfaseDe(zona, instante);
  return new Date(instante);
}

export function formatearFecha(fecha: Date, zona: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: zona,
  }).format(fecha);
}

// Zona horaria de la escuela (IANA), configurable con ZONA_HORARIA
export const ZONA_HORARIA = Symbol('ZonaHoraria');
