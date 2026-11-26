import { pendientesParaPublicar } from './pendientes';

const materia = (nombre: string, bloque: number, maestroId?: string) => ({
  id: nombre,
  planId: 'p',
  nombre,
  bloque,
  maestroId,
});

const completo = {
  semanasConContenido: [1, 2],
  examenes: [1, 2].flatMap((semana) =>
    [1, 2].map((numero) => ({ semana, numero })),
  ),
};

describe('pendientes para publicar un plan', () => {
  it('un plan sin materias no se publica', () => {
    expect(pendientesParaPublicar([])).toEqual(['El plan no tiene materias']);
  });

  it('un plan completo no tiene pendientes', () => {
    expect(
      pendientesParaPublicar([
        { materia: materia('Mate', 1, 'ana'), ...completo },
        { materia: materia('Historia', 2, 'ana'), ...completo },
      ]),
    ).toEqual([]);
  });

  it('señala bloques vacíos, maestros, contenido y exámenes que faltan', () => {
    expect(
      pendientesParaPublicar([
        { materia: materia('Mate', 1, 'ana'), ...completo },
        {
          materia: materia('Química', 3),
          semanasConContenido: [1],
          examenes: completo.examenes.slice(0, 3),
        },
      ]),
    ).toEqual([
      'El bloque 2 no tiene materias',
      'Química: no tiene maestro asignado',
      'Química: falta el contenido de la semana 2',
      'Química: falta el examen 2 de la semana 2',
    ]);
  });
});
