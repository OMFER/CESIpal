import { calificarExamen, revisarRespuestas } from './calificar';

describe('calificar un examen', () => {
  const preguntas = [
    { enunciado: 'a', opciones: ['x', 'y'], respuestaCorrecta: 0 },
    { enunciado: 'b', opciones: ['x', 'y'], respuestaCorrecta: 1 },
    { enunciado: 'c', opciones: ['x', 'y', 'z'], respuestaCorrecta: 2 },
  ];

  it('califica sobre 10 con dos decimales', () => {
    expect(calificarExamen(preguntas, [0, 1, 2])).toEqual({
      aciertos: 3,
      totalPreguntas: 3,
      calificacion: 10,
    });
    expect(calificarExamen(preguntas, [0, 0, 0]).calificacion).toBe(3.33);
  });

  it('un examen sin preguntas vale 0', () => {
    expect(calificarExamen([], []).calificacion).toBe(0);
  });

  it('la revisión solo trae la respuesta correcta si se permite', () => {
    const sin = revisarRespuestas(preguntas, [1, 1, 2], false);
    expect(sin.map((p) => p.acierto)).toEqual([false, true, true]);
    expect(sin[0]).not.toHaveProperty('respuestaCorrecta');
    const con = revisarRespuestas(preguntas, [1, 1, 2], true);
    expect(con[0].respuestaCorrecta).toBe(0);
  });
});
