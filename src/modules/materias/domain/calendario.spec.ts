import { calcularSemanaActual, generarSemanas } from './calendario';

describe('calendario del semestre', () => {
  const inicio = new Date('2026-08-03T00:00:00Z');

  it('devuelve 0 antes de que empiece el semestre', () => {
    expect(
      calcularSemanaActual(inicio, 16, new Date('2026-08-01T00:00:00Z')),
    ).toBe(0);
  });

  it('el primer y el séptimo día pertenecen a la semana 1', () => {
    expect(
      calcularSemanaActual(inicio, 16, new Date('2026-08-03T10:00:00Z')),
    ).toBe(1);
    expect(
      calcularSemanaActual(inicio, 16, new Date('2026-08-09T23:00:00Z')),
    ).toBe(1);
  });

  it('el octavo día empieza la semana 2', () => {
    expect(
      calcularSemanaActual(inicio, 16, new Date('2026-08-10T00:00:00Z')),
    ).toBe(2);
  });

  it('devuelve totalSemanas + 1 cuando el semestre terminó', () => {
    expect(
      calcularSemanaActual(inicio, 16, new Date('2027-03-01T00:00:00Z')),
    ).toBe(17);
  });

  it('marca semanas completadas, la actual y las futuras', () => {
    const semanas = generarSemanas(inicio, 4, new Date('2026-08-12T00:00:00Z'));
    expect(semanas.map((s) => s.estado)).toEqual([
      'completada',
      'actual',
      'futura',
      'futura',
    ]);
    expect(semanas[1].inicio.toISOString()).toBe('2026-08-10T00:00:00.000Z');
    expect(semanas[1].fin.toISOString()).toBe('2026-08-16T00:00:00.000Z');
  });
});
