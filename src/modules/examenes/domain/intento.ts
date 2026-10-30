import { ResultadoCalificacion } from './calificar';

// Respuestas de un alumno a un examen, ya calificadas. Solo hay uno por alumno y examen.
export interface Intento extends ResultadoCalificacion {
  id: string;
  examenId: string;
  alumnoId: string;
  // Índice de la opción elegida en cada pregunta, en el mismo orden que examen.preguntas
  respuestas: number[];
  fecha: Date;
}
