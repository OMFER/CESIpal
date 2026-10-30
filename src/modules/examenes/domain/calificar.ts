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

export interface PreguntaRevisada extends Pregunta {
  miRespuesta: number;
  acierto: boolean;
}

// Lo que ve el alumno después de responder: qué eligió, si acertó y cuál era la correcta
export function revisarRespuestas(
  preguntas: Pregunta[],
  respuestas: number[],
): PreguntaRevisada[] {
  return preguntas.map((pregunta, i) => ({
    ...pregunta,
    miRespuesta: respuestas[i],
    acierto: respuestas[i] === pregunta.respuestaCorrecta,
  }));
}
