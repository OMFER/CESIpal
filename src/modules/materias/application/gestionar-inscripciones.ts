import { Actor } from '../../../shared/domain/actor';
import { NoEncontradoError } from '../../../shared/domain/errores';
import { Usuario } from '../../usuarios/domain/usuario';
import { MateriaRepository } from '../domain/materia.repository';
import { InscripcionRepository } from '../domain/inscripcion.repository';
import { AccesoMaterias } from './acceso-materias';

export class InscribirAlumnos {
  constructor(
    private readonly materias: MateriaRepository,
    private readonly inscripciones: InscripcionRepository,
  ) {}

  async ejecutar(materiaId: string, alumnoIds: string[]): Promise<Usuario[]> {
    if (!(await this.materias.buscarPorId(materiaId))) {
      throw new NoEncontradoError('Materia no encontrada');
    }
    await this.inscripciones.inscribir(alumnoIds, materiaId);
    return this.inscripciones.alumnosDeMateria(materiaId);
  }
}

export class DarDeBajaAlumno {
  constructor(private readonly inscripciones: InscripcionRepository) {}

  ejecutar(materiaId: string, alumnoId: string): Promise<void> {
    return this.inscripciones.darDeBaja(alumnoId, materiaId);
  }
}

export class ListarAlumnosDeMateria {
  constructor(
    private readonly acceso: AccesoMaterias,
    private readonly inscripciones: InscripcionRepository,
  ) {}

  async ejecutar(materiaId: string, actor: Actor): Promise<Usuario[]> {
    await this.acceso.paraLeer(materiaId, actor);
    return this.inscripciones.alumnosDeMateria(materiaId);
  }
}
