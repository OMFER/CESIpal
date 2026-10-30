import { ResultadoCalificacion } from './calificar';

// Respuestas de un alumno a un examen en un grupo, ya calificadas. Solo hay una por alumno, examen y grupo.
export interface Intento extends ResultadoCalificacion {
  id: string;
  examenId: string;
  grupoId: string;
  alumnoId: string;
  // Índice de la opción elegida en cada pregunta, en el mismo orden que examen.preguntas
  respuestas: number[];
  fecha: Date;
}
