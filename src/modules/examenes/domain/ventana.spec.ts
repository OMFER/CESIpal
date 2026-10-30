import { TipoExamen } from './examen';
import { calcularVentana, validarQuePuedeResponder } from './ventana';

describe('calcularVentana', () => {
  // Semana 1 = 3 al 9 de agosto; 16 semanas → el semestre termina el 23 de noviembre
  const calendario = {
    fechaInicio: new Date('2026-08-03T00:00:00Z'),
    totalSemanas: 16,
  };
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  it('el Semanal abre al inicio de su semana y cierra al terminarla', () => {
    const v = calcularVentana(
      { tipo: TipoExamen.SEMANAL, semana: 2, diasExtra: 0 },
      calendario,
      new Date('2026-08-12T00:00:00Z'),
    );
    expect([iso(v.abre), iso(v.cierra), v.estado]).toEqual([
      '2026-08-10',
      '2026-08-17',
      'abierta',
    ]);
  });

  it('los días extra alargan el cierre', () => {
    const v = calcularVentana(
      { tipo: TipoExamen.SEMANAL, semana: 2, diasExtra: 3 },
      calendario,
      new Date('2026-08-19T00:00:00Z'),
    );
    expect([iso(v.cierra), v.estado]).toEqual(['2026-08-20', 'abierta']);
  });

  it('la Reposición abre cuando cierra el Semanal (con su prórroga) y dura una semana', () => {
    const v = calcularVentana(
      { tipo: TipoExamen.REPOSICION, semana: 2, diasExtra: 0 },
      calendario,
      new Date('2026-08-12T00:00:00Z'),
      3,
    );
    expect([iso(v.abre), iso(v.cierra), v.estado]).toEqual([
      '2026-08-20',
      '2026-08-27',
      'proxima',
    ]);
  });

  it('el Final abre al terminar el semestre', () => {
    const v = calcularVentana(
      { tipo: TipoExamen.FINAL, diasExtra: 0 },
      calendario,
      new Date('2026-12-01T00:00:00Z'),
    );
    expect([iso(v.abre), iso(v.cierra), v.estado]).toEqual([
      '2026-11-23',
      '2026-11-30',
      'cerrada',
    ]);
  });
});

describe('validarQuePuedeResponder', () => {
  const examen = {
    preguntas: [{ enunciado: '?', opciones: ['a', 'b'], respuestaCorrecta: 0 }],
  };
  const ventana = (estado: 'proxima' | 'abierta' | 'cerrada') => ({
    abre: new Date('2026-08-10T00:00:00Z'),
    cierra: new Date('2026-08-17T00:00:00Z'),
    estado,
  });

  it('dice cuándo abre si todavía no abre', () => {
    expect(() =>
      validarQuePuedeResponder(examen, ventana('proxima'), [0]),
    ).toThrow('El examen abre el 10 de agosto de 2026');
  });

  it('rechaza si ya cerró o si faltan respuestas', () => {
    expect(() =>
      validarQuePuedeResponder(examen, ventana('cerrada'), [0]),
    ).toThrow('ya cerró');
    expect(() =>
      validarQuePuedeResponder(examen, ventana('abierta'), []),
    ).toThrow('Se esperaban 1 respuestas');
  });
});
