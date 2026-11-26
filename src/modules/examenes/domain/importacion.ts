import { DatosInvalidosError } from '../../../shared/domain/errores';
import {
  EXAMENES_POR_SEMANA,
  SEMANAS_POR_MATERIA,
} from '../../planes/domain/plan';
import {
  MAXIMO_OPCIONES,
  Pregunta,
  problemasDePregunta,
  tituloPorDefecto,
} from './examen';

/**
 * Formato de la plantilla (una fila por pregunta, como la exporta Google Sheets en CSV):
 *   semana | examen | titulo (opcional) | pregunta | opcion_a … opcion_f | correcta
 * `correcta` es la letra de la opción (A, B, C…). El título se toma de la primera fila de cada examen.
 */
export const LETRAS = 'ABCDEF'.slice(0, MAXIMO_OPCIONES).split('');
export const COLUMNAS_DE_OPCION = LETRAS.map(
  (l) => `opcion_${l.toLowerCase()}`,
);
export const COLUMNAS_OBLIGATORIAS = [
  'semana',
  'examen',
  'pregunta',
  'opcion_a',
  'opcion_b',
  'correcta',
];

export interface FilaCruda {
  // Número de fila en la hoja (la 1 son los encabezados), para señalar el error
  fila: number;
  valores: Record<string, string>;
}

export interface HojaDeExamenes {
  columnas: string[];
  filas: FilaCruda[];
}

export interface ExamenImportado {
  semana: number;
  numero: number;
  titulo: string;
  preguntas: Pregunta[];
}

const entero = (texto: string) =>
  /^\d+$/.test(texto.trim()) ? Number(texto.trim()) : NaN;

// "B" o "b" → 1. También acepta el número de la opción (1 = A).
function indiceDeCorrecta(texto: string): number {
  const valor = texto.trim().toUpperCase();
  const letra = LETRAS.indexOf(valor);
  if (letra !== -1) return letra;
  const numero = entero(valor);
  return Number.isNaN(numero) ? NaN : numero - 1;
}

function opcionesDe(valores: Record<string, string>) {
  const celdas = COLUMNAS_DE_OPCION.map((c) => (valores[c] ?? '').trim());
  const ultima = celdas.map((c) => c !== '').lastIndexOf(true);
  return celdas.slice(0, ultima + 1);
}

/**
 * Convierte la hoja en exámenes, validando todo antes de guardar nada.
 * Si hay errores los junta todos (con su número de fila) para corregirlos de una vez.
 */
export function interpretarHoja({
  columnas,
  filas,
}: HojaDeExamenes): ExamenImportado[] {
  const faltantes = COLUMNAS_OBLIGATORIAS.filter((c) => !columnas.includes(c));
  if (faltantes.length) {
    throw new DatosInvalidosError(
      `A la hoja le faltan columnas: ${faltantes.join(', ')}`,
      faltantes.map((c) => `Falta la columna "${c}"`),
    );
  }

  const errores: string[] = [];
  const examenes = new Map<string, ExamenImportado>();
  const conDatos = filas.filter((f) =>
    Object.values(f.valores).some((v) => v.trim() !== ''),
  );
  if (conDatos.length === 0) {
    throw new DatosInvalidosError('La hoja no tiene preguntas');
  }

  for (const { fila, valores } of conDatos) {
    const problemas: string[] = [];
    const semana = entero(valores.semana ?? '');
    const numero = entero(valores.examen ?? '');
    if (!(semana >= 1 && semana <= SEMANAS_POR_MATERIA)) {
      problemas.push(`la semana debe ser 1 o ${SEMANAS_POR_MATERIA}`);
    }
    if (!(numero >= 1 && numero <= EXAMENES_POR_SEMANA)) {
      problemas.push(`el examen debe ser 1 o ${EXAMENES_POR_SEMANA}`);
    }
    const opciones = opcionesDe(valores);
    if (opciones.some((o) => o === '')) {
      problemas.push('hay una opción vacía entre otras opciones');
    }
    const pregunta: Pregunta = {
      enunciado: (valores.pregunta ?? '').trim(),
      opciones,
      respuestaCorrecta: indiceDeCorrecta(valores.correcta ?? ''),
    };
    problemas.push(
      ...problemasDePregunta(pregunta).filter(
        (p) => p !== 'tiene opciones vacías',
      ),
    );
    if (problemas.length) {
      errores.push(...problemas.map((p) => `Fila ${fila}: ${p}`));
      continue;
    }

    const clave = `${semana}-${numero}`;
    const examen = examenes.get(clave) ?? {
      semana,
      numero,
      titulo: (valores.titulo ?? '').trim() || tituloPorDefecto(semana, numero),
      preguntas: [],
    };
    examen.preguntas.push(pregunta);
    examenes.set(clave, examen);
  }

  if (errores.length) {
    throw new DatosInvalidosError(
      `La hoja tiene ${errores.length} ${errores.length === 1 ? 'error' : 'errores'}; no se importó nada`,
      errores,
    );
  }
  return [...examenes.values()].sort(
    (a, b) => a.semana - b.semana || a.numero - b.numero,
  );
}
