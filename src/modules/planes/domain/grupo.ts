// Una generación de alumnos que cursa una versión publicada del plan a partir de su fecha de inicio.
// Pueden coexistir varios grupos, con el mismo plan o con otro, cada uno con sus fechas.
export interface Grupo {
  id: string;
  planId: string;
  nombre: string;
  // Lunes en que empieza la semana 1 (medianoche en la zona de la escuela)
  fechaInicio: Date;
}
