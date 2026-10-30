import { Actor, Rol } from '../../../shared/domain/actor';
import {
  NoEncontradoError,
  SinPermisoError,
} from '../../../shared/domain/errores';
import { Materia } from '../domain/materia';
import { Grupo } from '../domain/grupo';
import { MateriaRepository } from '../domain/materia.repository';
import { GrupoRepository } from '../domain/grupo.repository';
import { InscripcionRepository } from '../domain/inscripcion.repository';
import {
  ParticipacionEnMateria,
  puedeEditarMateria,
  puedeVerGrupo,
  puedeVerMateria,
} from '../domain/politica-acceso';

export interface ContextoGrupo {
  grupo: Grupo;
  materia: Materia;
}

// Punto único donde se decide si un actor puede leer un grupo
export class AccesoGrupos {
  constructor(
    private readonly grupos: GrupoRepository,
    private readonly materias: MateriaRepository,
    private readonly inscripciones: InscripcionRepository,
  ) {}

  async paraLeer(grupoId: string, actor: Actor): Promise<ContextoGrupo> {
    const grupo = await this.grupos.buscarPorId(grupoId);
    if (!grupo) {
      throw new NoEncontradoError('Grupo no encontrado');
    }
    const inscrito =
      actor.rol === Rol.ALUMNO &&
      (await this.inscripciones.estaInscrito(actor.id, grupoId));
    if (!puedeVerGrupo(grupo, actor, inscrito)) {
      throw new SinPermisoError(
        actor.rol === Rol.ALUMNO
          ? 'No estás inscrito en este grupo'
          : 'No impartes este grupo',
      );
    }
    const materia = await this.materias.buscarPorId(grupo.materiaId);
    if (!materia) {
      throw new NoEncontradoError('Materia no encontrada');
    }
    return { grupo, materia };
  }
}

// Punto único donde se decide si un actor puede leer o modificar una materia y su contenido
export class AccesoMaterias {
  constructor(
    private readonly materias: MateriaRepository,
    private readonly grupos: GrupoRepository,
    private readonly inscripciones: InscripcionRepository,
  ) {}

  async paraLeer(materiaId: string, actor: Actor): Promise<Materia> {
    const materia = await this.buscar(materiaId);
    if (!puedeVerMateria(actor, await this.participacion(materiaId, actor))) {
      throw new SinPermisoError(
        actor.rol === Rol.ALUMNO
          ? 'No estás inscrito en esta materia'
          : 'No impartes esta materia',
      );
    }
    return materia;
  }

  async paraEditar(materiaId: string, actor: Actor): Promise<Materia> {
    const materia = await this.buscar(materiaId);
    const { imparte } = await this.participacion(materiaId, actor);
    if (!puedeEditarMateria(actor, imparte)) {
      throw new SinPermisoError(
        'Solo un maestro de la materia puede modificarla',
      );
    }
    return materia;
  }

  private async participacion(
    materiaId: string,
    actor: Actor,
  ): Promise<ParticipacionEnMateria> {
    if (actor.rol === Rol.MAESTRO) {
      return {
        imparte: await this.grupos.maestroImparteMateria(actor.id, materiaId),
        cursa: false,
      };
    }
    if (actor.rol === Rol.ALUMNO) {
      const grupos = await this.grupos.buscarPorIds(
        await this.inscripciones.gruposDeAlumno(actor.id),
      );
      return {
        imparte: false,
        cursa: grupos.some((g) => g.materiaId === materiaId),
      };
    }
    return { imparte: false, cursa: false };
  }

  private async buscar(materiaId: string): Promise<Materia> {
    const materia = await this.materias.buscarPorId(materiaId);
    if (!materia) {
      throw new NoEncontradoError('Materia no encontrada');
    }
    return materia;
  }
}
