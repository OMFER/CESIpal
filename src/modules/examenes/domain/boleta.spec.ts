import { Examen, TipoExamen } from './examen';
import { Intento } from './intento';
import { calificacionDelSemestre, construirBoleta } from './boleta';

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
    const boleta = construirBoleta(
      examenes,
      [intento('s1', 50), intento('r1', 8)],
      16,
    );
    expect(boleta.semanas[0]).toEqual({
      semana: 1,
      semanal: { calificacion: 50, puntajeMaximo: 100 },
      reposicion: { calificacion: 8, puntajeMaximo: 10 },
      mejor: { calificacion: 8, puntajeMaximo: 10 },
    });
  });

  it('una reposición peor no baja la calificación', () => {
    const boleta = construirBoleta(
      examenes,
      [intento('s1', 90), intento('r1', 1)],
      16,
    );
    expect(boleta.semanas[0].mejor).toEqual({
      calificacion: 90,
      puntajeMaximo: 100,
    });
  });

  it('deja en null lo que no ha presentado e incluye el final', () => {
    const boleta = construirBoleta(examenes, [intento('f', 70)], 16);
    expect(boleta.semanas.map((s) => [s.semana, s.mejor])).toEqual([
      [1, null],
      [2, null],
    ]);
    expect(boleta.final).toEqual({ calificacion: 70, puntajeMaximo: 100 });
  });
});

describe('calificacionDelSemestre', () => {
  const semana = (
    n: number,
    calificacion: number | null,
    puntajeMaximo = 100,
  ) => {
    const nota = calificacion === null ? null : { calificacion, puntajeMaximo };
    return { semana: n, semanal: nota, reposicion: null, mejor: nota };
  };

  it('cada semana y el final valen lo mismo, aunque aún no tengan examen', () => {
    // 16 semanas + final = 17 partes; un 75/100 en una sola semana → 7.5 / 17 ≈ 0.4
    expect(calificacionDelSemestre([semana(3, 75)], null, 16)).toBe(0.4);
  });

  it('todo en 10 da 10 y compara en porcentaje', () => {
    const semanas = [semana(1, 10, 10), semana(2, 100)];
    expect(
      calificacionDelSemestre(
        semanas,
        { calificacion: 5, puntajeMaximo: 5 },
        2,
      ),
    ).toBe(10);
  });

  it('ignora semanas fuera del semestre y sin presentar cuenta 0', () => {
    expect(
      calificacionDelSemestre([semana(1, null), semana(9, 100)], null, 1),
    ).toBe(0);
  });

  it('construirBoleta la incluye usando el total de semanas de la materia', () => {
    const boleta = construirBoleta(
      [examen('s1', TipoExamen.SEMANAL, 1), examen('f', TipoExamen.FINAL)],
      [intento('s1', 100), intento('f', 50)],
      1,
    );
    expect(boleta.semestre).toBe(7.5);
  });
});
