import { DatosInvalidosError } from '../../../shared/domain/errores';
import { interpretarHoja } from './importacion';

const COLUMNAS = [
  'semana',
  'examen',
  'titulo',
  'pregunta',
  'opcion_a',
  'opcion_b',
  'opcion_c',
  'correcta',
];

const hoja = (...filas: string[][]) => ({
  columnas: COLUMNAS,
  filas: filas.map((celdas, i) => ({
    fila: i + 2,
    valores: Object.fromEntries(COLUMNAS.map((c, j) => [c, celdas[j] ?? ''])),
  })),
});

const errores = (fn: () => unknown) => {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(DatosInvalidosError);
    return (error as DatosInvalidosError).detalles;
  }
  throw new Error('debió rechazarse');
};

describe('importar exámenes desde la plantilla', () => {
  it('agrupa las filas por semana y examen, en orden', () => {
    const examenes = interpretarHoja(
      hoja(
        ['2', '1', '', '¿Capital de Francia?', 'Roma', 'París', '', 'b'],
        ['1', '1', 'Repaso', '¿2 + 2?', '3', '4', '5', 'B'],
        ['1', '1', '', '¿3 + 3?', '6', '7', '', 'A'],
        ['', '', '', '', '', '', '', ''],
      ),
    );
    expect(examenes).toEqual([
      {
        semana: 1,
        numero: 1,
        titulo: 'Repaso',
        preguntas: [
          {
            enunciado: '¿2 + 2?',
            opciones: ['3', '4', '5'],
            respuestaCorrecta: 1,
          },
          { enunciado: '¿3 + 3?', opciones: ['6', '7'], respuestaCorrecta: 0 },
        ],
      },
      {
        semana: 2,
        numero: 1,
        titulo: 'Semana 2 · Examen 1',
        preguntas: [
          {
            enunciado: '¿Capital de Francia?',
            opciones: ['Roma', 'París'],
            respuestaCorrecta: 1,
          },
        ],
      },
    ]);
  });

  it('reporta todos los errores con su número de fila y no importa nada', () => {
    expect(
      errores(() =>
        interpretarHoja(
          hoja(
            ['1', '1', '', '¿Bien?', 'Sí', 'No', '', 'A'],
            ['3', '1', '', '¿Semana?', 'a', 'b', '', 'A'],
            ['1', '2', '', '¿Correcta?', 'a', 'b', '', 'C'],
            ['1', '2', '', '', 'a', '', 'c', 'A'],
          ),
        ),
      ),
    ).toEqual([
      'Fila 3: la semana debe ser 1 o 2',
      'Fila 4: la respuesta correcta debe ser una de sus 2 opciones',
      'Fila 5: hay una opción vacía entre otras opciones',
      'Fila 5: le falta el enunciado',
    ]);
  });

  it('avisa si faltan columnas o si la hoja está vacía', () => {
    expect(
      errores(() =>
        interpretarHoja({ columnas: ['semana', 'pregunta'], filas: [] }),
      ),
    ).toContain('Falta la columna "correcta"');
    expect(() => interpretarHoja(hoja())).toThrow('no tiene preguntas');
  });
});
