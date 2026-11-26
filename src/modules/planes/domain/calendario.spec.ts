import {
  calcularSemanaActual,
  generarSemanas,
  inicioDeSemana,
  semanaDelGrupo,
  totalSemanas,
} from './calendario';

describe('calendario del grupo', () => {
  // Lunes
  const inicio = new Date('2026-08-03T00:00:00Z');

  it('8 materias en 4 bloques de dos semanas dan 8 semanas', () => {
    const materias = [1, 1, 2, 2, 3, 3, 4, 4].map((bloque) => ({ bloque }));
    expect(totalSemanas(materias)).toBe(8);
    expect(totalSemanas([])).toBe(0);
  });

  it('la semana 2 de una materia del bloque 3 es la semana 6 del grupo', () => {
    expect(semanaDelGrupo(1, 1)).toBe(1);
    expect(semanaDelGrupo(3, 2)).toBe(6);
    expect(inicioDeSemana(inicio, 6).toISOString()).toBe(
      '2026-09-07T00:00:00.000Z',
    );
  });

  it('devuelve 0 antes de empezar y total + 1 al terminar', () => {
    expect(
      calcularSemanaActual(inicio, 8, new Date('2026-08-01T00:00:00Z')),
    ).toBe(0);
    expect(
      calcularSemanaActual(inicio, 8, new Date('2026-08-09T23:00:00Z')),
    ).toBe(1);
    expect(
      calcularSemanaActual(inicio, 8, new Date('2026-08-10T00:00:00Z')),
    ).toBe(2);
    expect(
      calcularSemanaActual(inicio, 8, new Date('2026-12-01T00:00:00Z')),
    ).toBe(9);
  });

  it('cada semana sabe su estado, su bloque y qué semana de la materia es', () => {
    const semanas = generarSemanas(inicio, 4, new Date('2026-08-12T00:00:00Z'));
    expect(semanas.map((s) => [s.estado, s.bloque, s.semanaDeMateria])).toEqual(
      [
        ['completada', 1, 1],
        ['actual', 1, 2],
        ['futura', 2, 1],
        ['futura', 2, 2],
      ],
    );
    expect(semanas[1].fin.toISOString()).toBe('2026-08-16T00:00:00.000Z');
  });
});
