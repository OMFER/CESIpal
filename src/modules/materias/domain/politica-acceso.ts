import { Actor, Rol } from '../../../shared/domain/actor';
import { Grupo } from './grupo';

// Un grupo lo ve el admin, su maestro y sus alumnos inscritos
export function puedeVerGrupo(
  grupo: Grupo,
  actor: Actor,
  alumnoInscrito: boolean,
): boolean {
  switch (actor.rol) {
    case Rol.ADMIN:
      return true;
    case Rol.MAESTRO:
      return grupo.maestroId === actor.id;
    case Rol.ALUMNO:
      return alumnoInscrito;
  }
}

export interface ParticipacionEnMateria {
  // El maestro imparte (o impartió) algún grupo de la materia
  imparte: boolean;
  // El alumno está inscrito en algún grupo de la materia
  cursa: boolean;
}

export function puedeVerMateria(
  actor: Actor,
  { imparte, cursa }: ParticipacionEnMateria,
): boolean {
  switch (actor.rol) {
    case Rol.ADMIN:
      return true;
    case Rol.MAESTRO:
      return imparte;
    case Rol.ALUMNO:
      return cursa;
  }
}

// El contenido y los exámenes los edita el admin o cualquier maestro que imparta la materia
export function puedeEditarMateria(actor: Actor, imparte: boolean): boolean {
  return actor.rol === Rol.ADMIN || (actor.rol === Rol.MAESTRO && imparte);
}
