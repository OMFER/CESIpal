import { Actor } from '../../../shared/domain/actor';
import {
  ConflictoError,
  NoEncontradoError,
} from '../../../shared/domain/errores';
import { PublicadorEventos } from '../../../shared/domain/eventos';
import {
  Materia,
  SEMANAS_POR_DEFECTO,
  validarTotalSemanas,
} from '../domain/materia';
import { DatosMateria, MateriaRepository } from '../domain/materia.repository';
import { GrupoRepository } from '../domain/grupo.repository';
import { UsoDeSemanas } from '../domain/uso-de-semanas';
import { AccesoMaterias } from './acceso';

export type NuevaMateria = Omit<DatosMateria, 'totalSemanas'> & {
  totalSemanas?: number;
};

export class CrearMateria {
  constructor(private readonly materias: MateriaRepository) {}

  ejecutar(datos: NuevaMateria): Promise<Materia> {
    const totalSemanas = datos.totalSemanas ?? SEMANAS_POR_DEFECTO;
    validarTotalSemanas(totalSemanas);
    return this.materias.crear({
      ...datos,
      nombre: datos.nombre.trim(),
      totalSemanas,
    });
  }
}

export class ActualizarMateria {
  constructor(
    private readonly materias: MateriaRepository,
    private readonly usoDeSemanas: UsoDeSemanas,
  ) {}

  async ejecutar(id: string, cambios: Partial<DatosMateria>): Promise<Materia> {
    if (cambios.totalSemanas !== undefined) {
      validarTotalSemanas(cambios.totalSemanas);
      // No se puede recortar el semestre por debajo de semanas que ya tienen contenido o exámenes
      const ultima = await this.usoDeSemanas.ultimaSemanaOcupada(id);
      if (cambios.totalSemanas < ultima) {
        throw new ConflictoError(
          `La semana ${ultima} ya tiene contenido o exámenes; la materia no puede tener menos de ${ultima} semanas`,
        );
      }
    }
    const materia = await this.materias.actualizar(id, cambios);
    if (!materia) {
      throw new NoEncontradoError('Materia no encontrada');
    }
    return materia;
  }
}

// Solo se borra una materia sin grupos; su contenido y exámenes se borran con ella
export class EliminarMateria {
  constructor(
    private readonly materias: MateriaRepository,
    private readonly grupos: GrupoRepository,
    private readonly eventos: PublicadorEventos,
  ) {}

  async ejecutar(id: string): Promise<void> {
    if (!(await this.materias.buscarPorId(id))) {
      throw new NoEncontradoError('Materia no encontrada');
    }
    if (await this.grupos.existeDeMateria(id)) {
      throw new ConflictoError(
        'La materia tiene grupos; elimínalos antes de borrar la materia',
      );
    }
    await this.materias.eliminar(id);
    await this.eventos.publicar({ tipo: 'MateriaEliminada', materiaId: id });
  }
}

export class ListarMaterias {
  constructor(private readonly materias: MateriaRepository) {}

  ejecutar(): Promise<Materia[]> {
    return this.materias.listar();
  }
}

export class ObtenerMateria {
  constructor(private readonly acceso: AccesoMaterias) {}

  ejecutar(id: string, actor: Actor): Promise<Materia> {
    return this.acceso.paraLeer(id, actor);
  }
}
