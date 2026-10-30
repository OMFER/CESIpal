// Una materia impartida en un semestre: aquí viven el maestro, los alumnos y sus calificaciones
export interface Grupo {
  id: string;
  materiaId: string;
  maestroId: string;
  nombre: string;
  // Etiqueta del semestre, p. ej. "2026-B"
  periodo: string;
  aula?: string;
  // Primer día de la semana 1
  fechaInicio: Date;
}
