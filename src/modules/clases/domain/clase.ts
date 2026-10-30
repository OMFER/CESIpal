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
  enVivo?: string;
  // Clase grabada (Drive, Zoom, Meet...)
  grabacion?: string;
  descGrabacion?: string;
  presentacion?: string;
}

// Contenido de una semana de una materia: lo que se muestra en la infografía
export interface Clase {
  id: string;
  materiaId: string;
  semana: number;
  tema: string;
  introduccion?: string;
  // En el orden en que el maestro quiere mostrarlos
  recursos: Recurso[];
  fechaEnVivo?: Date;
  links?: LinksClase;
}
