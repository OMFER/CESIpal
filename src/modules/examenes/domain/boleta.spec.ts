import { Examen, TipoExamen } from './examen';
import { Intento } from './intento';
import { construirBoleta } from './boleta';

const examen = (
  id: string,
  tipo: TipoExamen,
  semana?: number,
  puntajeMaximo = 100,
): Examen => ({
  id,
  materiaId: 'm',
  tipo,
  semana,
  titulo: id,
  puntajeMaximo,
  diasExtra: 0,
  preguntas: [],
});
const intento = (examenId: string, calificacion: number) =>
  ({ examenId, calificacion }) as Intento;

describe('construirBoleta', () => {
  const examenes = [
    examen('s1', TipoExamen.SEMANAL, 1),
    examen('r1', TipoExamen.REPOSICION, 1, 10),
    examen('s2', TipoExamen.SEMANAL, 2),
    examen('f', TipoExamen.FINAL),
  ];

  it('toma la mejor nota de la semana comparando porcentajes', () => {
    // 50/100 en el semanal contra 8/10 en la reposición: gana la reposición
    const boleta = construirBoleta(examenes, [
      intento('s1', 50),
      intento('r1', 8),
    ]);
    expect(boleta.semanas[0]).toEqual({
      semana: 1,
      semanal: { calificacion: 50, puntajeMaximo: 100 },
      reposicion: { calificacion: 8, puntajeMaximo: 10 },
      mejor: { calificacion: 8, puntajeMaximo: 10 },
    });
  });

  it('una reposición peor no baja la calificación', () => {
    const boleta = construirBoleta(examenes, [
      intento('s1', 90),
      intento('r1', 1),
    ]);
    expect(boleta.semanas[0].mejor).toEqual({
      calificacion: 90,
      puntajeMaximo: 100,
    });
  });

  it('deja en null lo que no ha presentado e incluye el final', () => {
    const boleta = construirBoleta(examenes, [intento('f', 70)]);
    expect(boleta.semanas.map((s) => [s.semana, s.mejor])).toEqual([
      [1, null],
      [2, null],
    ]);
    expect(boleta.final).toEqual({ calificacion: 70, puntajeMaximo: 100 });
  });
});
