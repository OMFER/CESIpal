import { calificarExamen } from './calificar';

describe('calificarExamen', () => {
  const preguntas = [
    { respuestaCorrecta: 0 },
    { respuestaCorrecta: 2 },
    { respuestaCorrecta: 1 },
  ];

  it('da el puntaje máximo con todas correctas', () => {
    expect(calificarExamen(preguntas, [0, 2, 1], 100)).toEqual({
      aciertos: 3,
      totalPreguntas: 3,
      calificacion: 100,
    });
  });

  it('es proporcional a los aciertos y redondea a 2 decimales', () => {
    expect(calificarExamen(preguntas, [0, 1, 1], 10)).toEqual({
      aciertos: 2,
      totalPreguntas: 3,
      calificacion: 6.67,
    });
  });

  it('da 0 sin aciertos', () => {
    expect(calificarExamen(preguntas, [1, 1, 0], 100).calificacion).toBe(0);
  });
});
