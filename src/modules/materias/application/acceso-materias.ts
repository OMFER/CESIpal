import { Actor, Rol } from '../../../shared/domain/actor';
import {
  NoEncontradoError,
  SinPermisoError,
} from '../../../shared/domain/errores';
import { Materia } from '../domain/materia';
import { MateriaRepository } from '../domain/materia.repository';
import { InscripcionRepository } from '../domain/inscripcion.repository';
import { puedeEditarMateria, puedeVerMateria } from '../domain/politica-acceso';

// Punto único donde se decide si un actor puede leer o modificar una materia y lo que contiene
export class AccesoMaterias {
  constructor(
    private readonly materias: MateriaRepository,
    private readonly inscripciones: InscripcionRepository,
  ) {}

  async paraLeer(materiaId: string, actor: Actor): Promise<Materia> {
    const materia = await this.buscar(materiaId);
    const inscrito =
      actor.rol === Rol.ALUMNO &&
      (await this.inscripciones.estaInscrito(actor.id, materiaId));
    if (!puedeVerMateria(materia, actor, inscrito)) {
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
    if (!puedeEditarMateria(materia, actor)) {
      throw new SinPermisoError(
        'Solo el maestro de la materia puede modificarla',
      );
    }
    return materia;
  }

  private async buscar(materiaId: string): Promise<Materia> {
    const materia = await this.materias.buscarPorId(materiaId);
    if (!materia) {
      throw new NoEncontradoError('Materia no encontrada');
    }
    return materia;
  }
}
