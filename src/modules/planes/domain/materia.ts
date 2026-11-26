// Una materia dentro de una versión del plan. Su contenido y exámenes cuelgan de ella.
export interface Materia {
  id: string;
  planId: string;
  nombre: string;
  descripcion?: string;
  // Bloque de dos semanas en el que se cursa (1 = semanas 1 y 2 del grupo, 2 = semanas 3 y 4…)
  bloque: number;
  // Cuenta de la escuela que corrige su contenido y exámenes
  maestroId?: string;
}
