import { Examen } from './examen';
import { Intento } from './intento';
import { construirBoleta } from './boleta';

const examen = (materiaId: string, semana: number, numero: number): Examen => ({
  id: `${materiaId}-${semana}-${numero}`,
  materiaId,
  semana,
  numero,
  titulo: 'x',
  diasExtra: 0,
  preguntas: [],
});

const intento = (examenId: string, calificacion: number): Intento => ({
  id: `i-${examenId}`,
  examenId,
  grupoId: 'g',
  alumnoId: 'a',
  respuestas: [],
  aciertos: 0,
  totalPreguntas: 0,
  calificacion,
  fecha: new Date(),
});

describe('boleta del alumno', () => {
  const examenes = ['mate', 'hist'].flatMap((m) =>
    [1, 2].flatMap((s) => [1, 2].map((n) => examen(m, s, n))),
  );

  it('promedia los cuatro exámenes de cada materia; lo no presentado cuenta 0', () => {
    const boleta = construirBoleta(['mate', 'hist'], examenes, [
      intento('mate-1-1', 10),
      intento('mate-1-2', 8),
      intento('mate-2-1', 6),
      intento('mate-2-2', 4),
      intento('hist-1-1', 10),
    ]);
    const [mate, hist] = boleta.materias;
    expect(mate).toMatchObject({
      materiaId: 'mate',
      promedio: 7,
      aprobada: true,
      completa: true,
    });
    expect(mate.notas.map((n) => [n.semana, n.numero, n.calificacion])).toEqual(
      [
        [1, 1, 10],
        [1, 2, 8],
        [2, 1, 6],
        [2, 2, 4],
      ],
    );
    expect(hist).toMatchObject({
      promedio: 2.5,
      aprobada: false,
      completa: false,
    });
    expect(hist.notas[1].calificacion).toBeNull();
    // (7 + 2.5) / 2
    expect(boleta.promedioGeneral).toBe(4.8);
  });

  it('se aprueba con 6 exacto', () => {
    const boleta = construirBoleta(
      ['mate'],
      examenes,
      ['mate-1-1', 'mate-1-2', 'mate-2-1', 'mate-2-2'].map((id) =>
        intento(id, 6),
      ),
    );
    expect(boleta.materias[0]).toMatchObject({ promedio: 6, aprobada: true });
  });

  it('una materia sin intentos tiene promedio 0 y sus cuatro notas vacías', () => {
    const boleta = construirBoleta(['hist'], examenes, []);
    expect(boleta.materias[0].notas).toHaveLength(4);
    expect(boleta.materias[0].promedio).toBe(0);
    expect(boleta.promedioGeneral).toBe(0);
  });
});
