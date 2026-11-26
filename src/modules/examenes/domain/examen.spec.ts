import { DatosInvalidosError } from '../../../shared/domain/errores';
import {
  esCorreccionDeTexto,
  validarPreguntas,
  validarSemanaYNumero,
} from './examen';

describe('reglas del examen', () => {
  const pregunta = (opciones: string[], respuestaCorrecta: number) => ({
    enunciado: '¿Pregunta?',
    opciones,
    respuestaCorrecta,
  });

  it('solo hay semanas 1 y 2 y exámenes 1 y 2', () => {
    expect(() => validarSemanaYNumero(2, 2)).not.toThrow();
    expect(() => validarSemanaYNumero(3, 1)).toThrow('entre 1 y 2');
    expect(() => validarSemanaYNumero(1, 3)).toThrow('número de examen');
  });

  it('junta los problemas de todas las preguntas', () => {
    let detalles: string[] | undefined;
    try {
      validarPreguntas([pregunta(['a'], 0), pregunta(['a', 'b'], 4)]);
    } catch (error) {
      detalles = (error as DatosInvalidosError).detalles;
    }
    expect(detalles).toEqual([
      'Pregunta 1: debe tener entre 2 y 6 opciones',
      'Pregunta 2: la respuesta correcta debe ser una de sus 2 opciones',
    ]);
  });

  it('corregir la redacción no cambia preguntas, opciones ni respuestas', () => {
    const antes = [pregunta(['Rojo', 'Azul'], 1)];
    expect(
      esCorreccionDeTexto(antes, [
        { ...pregunta(['Rojo', 'Azul claro'], 1), enunciado: 'Corregida' },
      ]),
    ).toBe(true);
    // Cambia la respuesta correcta
    expect(esCorreccionDeTexto(antes, [pregunta(['Rojo', 'Azul'], 0)])).toBe(
      false,
    );
    // Agrega una opción
    expect(
      esCorreccionDeTexto(antes, [pregunta(['Rojo', 'Azul', 'Verde'], 1)]),
    ).toBe(false);
    // Agrega una pregunta
    expect(esCorreccionDeTexto(antes, [...antes, ...antes])).toBe(false);
  });
});
