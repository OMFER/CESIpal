/**
 * Lee un CSV como lo exporta Google Sheets o Excel (RFC 4180): celdas entre comillas con comas,
 * saltos de línea o comillas dobladas (""). Detecta si el separador es coma o punto y coma.
 */
export function leerCsv(texto: string): string[][] {
  const contenido = texto.replace(/^\uFEFF/, '');
  const primeraLinea = contenido.split(/\r?\n/, 1)[0] ?? '';
  const separador =
    (primeraLinea.match(/;/g)?.length ?? 0) >
    (primeraLinea.match(/,/g)?.length ?? 0)
      ? ';'
      : ',';

  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = '';
  let entreComillas = false;

  for (let i = 0; i < contenido.length; i++) {
    const c = contenido[i];
    if (entreComillas) {
      if (c === '"' && contenido[i + 1] === '"') {
        celda += '"';
        i++;
      } else if (c === '"') {
        entreComillas = false;
      } else {
        celda += c;
      }
    } else if (c === '"') {
      entreComillas = true;
    } else if (c === separador) {
      fila.push(celda);
      celda = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && contenido[i + 1] === '\n') i++;
      fila.push(celda);
      filas.push(fila);
      fila = [];
      celda = '';
    } else {
      celda += c;
    }
  }
  if (celda !== '' || fila.length) {
    fila.push(celda);
    filas.push(fila);
  }
  return filas;
}

// "Opción A " → "opcion_a": así los encabezados toleran acentos, mayúsculas y espacios
export const normalizarEncabezado = (encabezado: string) =>
  encabezado
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

export interface TablaCsv {
  columnas: string[];
  // Cada fila con su número en la hoja (los encabezados son la fila 1)
  filas: { fila: number; valores: Record<string, string> }[];
}

export function leerTablaCsv(texto: string): TablaCsv {
  const [encabezados = [], ...resto] = leerCsv(texto);
  const columnas = encabezados.map(normalizarEncabezado);
  return {
    columnas,
    filas: resto.map((celdas, i) => ({
      fila: i + 2,
      valores: Object.fromEntries(
        columnas.map((columna, j) => [columna, celdas[j] ?? '']),
      ),
    })),
  };
}
