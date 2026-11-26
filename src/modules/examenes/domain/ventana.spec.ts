import {
  calcularVentana,
  puedeRevelarRespuestas,
  validarQuePuedeResponder,
} from './ventana';

describe('ventana de un examen', () => {
  // Lunes de la semana del examen
  const lunes = new Date('2026-08-10T00:00:00Z');
  const el = (fecha: string) => new Date(`${fecha}T12:00:00Z`);

  it('el examen 1 abre el lunes y cierra al terminar el domingo', () => {
    const ventana = calcularVentana(
      { numero: 1, diasExtra: 0 },
      lunes,
      el('2026-08-10'),
    );
    expect(ventana.abre.toISOString()).toBe('2026-08-10T00:00:00.000Z');
    expect(ventana.cierra.toISOString()).toBe('2026-08-17T00:00:00.000Z');
    expect(ventana.estado).toBe('abierta');
  });

  it('el examen 2 abre el jueves y cierra a la vez que el 1', () => {
    const examen = { numero: 2, diasExtra: 0 };
    expect(calcularVentana(examen, lunes, el('2026-08-12')).estado).toBe(
      'proxima',
    );
    const ventana = calcularVentana(examen, lunes, el('2026-08-13'));
    expect(ventana.abre.toISOString()).toBe('2026-08-13T00:00:00.000Z');
    expect(ventana.cierra.toISOString()).toBe('2026-08-17T00:00:00.000Z');
    expect(ventana.estado).toBe('abierta');
  });

  it('los días extra alargan el cierre', () => {
    const ventana = calcularVentana(
      { numero: 1, diasExtra: 2 },
      lunes,
      el('2026-08-18'),
    );
    expect(ventana.cierra.toISOString()).toBe('2026-08-19T00:00:00.000Z');
    expect(ventana.estado).toBe('abierta');
  });

  it('las respuestas correctas se revelan solo cuando ya cerró', () => {
    const examen = { numero: 1, diasExtra: 0 };
    expect(
      puedeRevelarRespuestas(calcularVentana(examen, lunes, el('2026-08-16'))),
    ).toBe(false);
    expect(
      puedeRevelarRespuestas(calcularVentana(examen, lunes, el('2026-08-17'))),
    ).toBe(true);
  });

  it('rechaza respuestas fuera de la ventana, incompletas o que no son opciones', () => {
    const examen = {
      preguntas: [
        { enunciado: 'a', opciones: ['x', 'y'], respuestaCorrecta: 0 },
      ],
    };
    const abierta = calcularVentana(
      { numero: 1, diasExtra: 0 },
      lunes,
      el('2026-08-11'),
    );
    const proxima = calcularVentana(
      { numero: 2, diasExtra: 0 },
      lunes,
      el('2026-08-11'),
    );
    expect(() => validarQuePuedeResponder(examen, proxima, [0])).toThrow(
      'El examen abre el 13 de agosto de 2026',
    );
    expect(() => validarQuePuedeResponder(examen, abierta, [])).toThrow(
      'Se esperaban 1 respuestas',
    );
    expect(() => validarQuePuedeResponder(examen, abierta, [5])).toThrow(
      'no es una de sus opciones',
    );
    expect(() => validarQuePuedeResponder(examen, abierta, [1])).not.toThrow();
  });
});
