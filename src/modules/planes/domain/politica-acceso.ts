import { Actor, Rol } from '../../../shared/domain/actor';
import { Materia } from './materia';

// El contenido y los exámenes de una materia los corrige el admin o el maestro asignado a ella
export function puedeEditarMateria(actor: Actor, materia: Materia): boolean {
  return (
    actor.rol === Rol.ADMIN ||
    (actor.rol === Rol.MAESTRO && materia.maestroId === actor.id)
  );
}

// Además, la leen los alumnos inscritos en algún grupo que cursa su plan
export function puedeVerMateria(
  actor: Actor,
  materia: Materia,
  cursaElPlan: boolean,
): boolean {
  return (
    puedeEditarMateria(actor, materia) ||
    (actor.rol === Rol.ALUMNO && cursaElPlan)
  );
}

export interface ParticipacionEnGrupo {
  // El alumno está inscrito en el grupo
  inscrito: boolean;
  // El maestro tiene asignada alguna materia del plan del grupo
  imparte: boolean;
}

export function puedeVerGrupo(
  actor: Actor,
  { inscrito, imparte }: ParticipacionEnGrupo,
): boolean {
  switch (actor.rol) {
    case Rol.ADMIN:
      return true;
    case Rol.MAESTRO:
      return imparte;
    case Rol.ALUMNO:
      return inscrito;
  }
}
