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

export interface PreguntaRevisada extends Omit<Pregunta, 'respuestaCorrecta'> {
  miRespuesta: number;
  acierto: boolean;
  // Solo cuando ya cerró el examen; antes, otros alumnos aún podrían responderlo
  respuestaCorrecta?: number;
}

// Lo que ve el alumno después de responder: qué eligió, si acertó y, si ya cerró, cuál era la correcta
export function revisarRespuestas(
  preguntas: Pregunta[],
  respuestas: number[],
  conRespuestasCorrectas: boolean,
): PreguntaRevisada[] {
  return preguntas.map(({ respuestaCorrecta, ...pregunta }, i) => ({
    ...pregunta,
    miRespuesta: respuestas[i],
    acierto: respuestas[i] === respuestaCorrecta,
    ...(conRespuestasCorrectas && { respuestaCorrecta }),
  }));
}
