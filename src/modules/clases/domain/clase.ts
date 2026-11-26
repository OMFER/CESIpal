export enum TipoRecurso {
  PDF = 'pdf',
  WEB = 'web',
  YOUTUBE = 'youtube',
}

export interface Recurso {
  tipo: TipoRecurso;
  titulo: string;
  url: string;
  descripcion?: string;
}

export interface LinksClase {
  // Clase grabada (Drive de la escuela, Zoom, Meet...)
  grabacion?: string;
  descGrabacion?: string;
  presentacion?: string;
}

// Contenido de una semana de una materia: lo que se muestra en la infografía. Es igual para todos los grupos.
export interface Clase {
  id: string;
  materiaId: string;
  // Semana de la materia (1 o 2)
  semana: number;
  tema: string;
  introduccion?: string;
  // En el orden en que el maestro quiere mostrarlos
  recursos: Recurso[];
  links?: LinksClase;
}
