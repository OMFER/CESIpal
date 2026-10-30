import { Actor, Rol } from '../../../shared/domain/actor';
import { Materia } from './materia';

// Quién puede ver una materia: el admin todas, el maestro las que imparte y el alumno las que tiene inscritas
export function puedeVerMateria(
  materia: Materia,
  actor: Actor,
  alumnoInscrito: boolean,
): boolean {
  switch (actor.rol) {
    case Rol.ADMIN:
      return true;
    case Rol.MAESTRO:
      return materia.maestroId === actor.id;
    case Rol.ALUMNO:
      return alumnoInscrito;
  }
}

// Quién puede modificar su contenido (semanas, exámenes): el admin y el maestro que la imparte
export function puedeEditarMateria(materia: Materia, actor: Actor): boolean {
  return (
    actor.rol === Rol.ADMIN ||
    (actor.rol === Rol.MAESTRO && materia.maestroId === actor.id)
  );
}
