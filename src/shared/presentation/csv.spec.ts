import { readFileSync } from 'fs';
import { join } from 'path';
import { interpretarHoja } from '../../modules/examenes/domain/importacion';
import { leerCsv, leerTablaCsv } from './csv';

describe('leer CSV', () => {
  it('respeta comillas, comas y saltos de línea dentro de una celda', () => {
    expect(
      leerCsv('a,b\r\n"Hola, mundo","dijo ""sí""\nen dos líneas"\r\n'),
    ).toEqual([
      ['a', 'b'],
      ['Hola, mundo', 'dijo "sí"\nen dos líneas'],
    ]);
  });

  it('detecta el punto y coma como separador', () => {
    expect(leerCsv('a;b\n1;2,5')).toEqual([
      ['a', 'b'],
      ['1', '2,5'],
    ]);
  });

  it('normaliza los encabezados y numera las filas como en la hoja', () => {
    const tabla = leerTablaCsv('\uFEFFSemana,Opción A\n1,Roma');
    expect(tabla.columnas).toEqual(['semana', 'opcion_a']);
    expect(tabla.filas).toEqual([
      { fila: 2, valores: { semana: '1', opcion_a: 'Roma' } },
    ]);
  });

  it('la plantilla de exámenes que se comparte con los maestros es válida', () => {
    const csv = readFileSync(
      join(__dirname, '../../../docs/plantilla-examenes.csv'),
      'utf8',
    );
    const examenes = interpretarHoja(leerTablaCsv(csv));
    expect(
      examenes.map((e) => [e.semana, e.numero, e.preguntas.length]),
    ).toEqual([
      [1, 1, 2],
      [1, 2, 1],
      [2, 1, 1],
      [2, 2, 1],
    ]);
    expect(examenes[0].titulo).toBe('Repaso de fracciones');
  });
});
