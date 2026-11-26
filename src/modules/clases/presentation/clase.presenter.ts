import { Clase } from '../domain/clase';

export function presentarClase(clase: Clase) {
  return {
    _id: clase.id,
    materia: clase.materiaId,
    semana: clase.semana,
    tema: clase.tema,
    introduccion: clase.introduccion,
    recursos: clase.recursos,
    links: clase.links,
  };
}
