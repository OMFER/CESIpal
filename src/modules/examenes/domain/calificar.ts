import { Pregunta } from './examen';

export interface ResultadoCalificacion {
  aciertos: number;
  totalPreguntas: number;
  calificacion: number;
}

export function calificarExamen(
  preguntas: Pick<Pregunta, 'respuestaCorrecta'>[],
  respuestas: number[],
  puntajeMaximo: number,
): ResultadoCalificacion {
  const totalPreguntas = preguntas.length;
  const aciertos = preguntas.filter(
    (p, i) => respuestas[i] === p.respuestaCorrecta,
  ).length;
  const calificacion =
    totalPreguntas === 0
      ? 0
      : Math.round((aciertos / totalPreguntas) * puntajeMaximo * 100) / 100;
  return { aciertos, totalPreguntas, calificacion };
}
