import { Actor } from '../../../shared/domain/actor';
import { NoEncontradoError } from '../../../shared/domain/errores';
import { Usuario } from '../../usuarios/domain/usuario';
import { GrupoRepository } from '../domain/grupo.repository';
import { InscripcionRepository } from '../domain/inscripcion.repository';
import { AccesoGrupos } from './acceso';

export class InscribirAlumnos {
  constructor(
    private readonly grupos: GrupoRepository,
    private readonly inscripciones: InscripcionRepository,
  ) {}

  async ejecutar(grupoId: string, alumnoIds: string[]): Promise<Usuario[]> {
    if (!(await this.grupos.buscarPorId(grupoId))) {
      throw new NoEncontradoError('Grupo no encontrado');
    }
    await this.inscripciones.inscribir(alumnoIds, grupoId);
    return this.inscripciones.alumnosDeGrupo(grupoId);
  }
}

export class DarDeBajaAlumno {
  constructor(private readonly inscripciones: InscripcionRepository) {}

  ejecutar(grupoId: string, alumnoId: string): Promise<void> {
    return this.inscripciones.darDeBaja(alumnoId, grupoId);
  }
}

export class ListarAlumnosDeGrupo {
  constructor(
    private readonly acceso: AccesoGrupos,
    private readonly inscripciones: InscripcionRepository,
  ) {}

  async ejecutar(grupoId: string, actor: Actor): Promise<Usuario[]> {
    await this.acceso.paraLeer(grupoId, actor);
    return this.inscripciones.alumnosDeGrupo(grupoId);
  }
}
