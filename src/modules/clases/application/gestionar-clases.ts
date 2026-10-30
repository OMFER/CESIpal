import { Actor } from '../../../shared/domain/actor';
import {
  ConflictoError,
  NoEncontradoError,
} from '../../../shared/domain/errores';
import { validarSemanaDeMateria } from '../../materias/domain/materia';
import { AccesoMaterias } from '../../materias/application/acceso';
import { Clase } from '../domain/clase';
import {
  CambiosClase,
  ClaseRepository,
  DatosClase,
} from '../domain/clase.repository';

export type NuevaClase = Omit<DatosClase, 'recursos'> &
  Partial<Pick<DatosClase, 'recursos'>>;

export class CrearClase {
  constructor(
    private readonly acceso: AccesoMaterias,
    private readonly clases: ClaseRepository,
  ) {}

  async ejecutar(datos: NuevaClase, actor: Actor): Promise<Clase> {
    const materia = await this.acceso.paraEditar(datos.materiaId, actor);
    validarSemanaDeMateria(materia, datos.semana);
    if (await this.clases.buscarPorSemana(datos.materiaId, datos.semana)) {
      throw new ConflictoError(
        `La semana ${datos.semana} ya tiene contenido; edítalo en lugar de crear otro`,
      );
    }
    return this.clases.crear({ ...datos, recursos: datos.recursos ?? [] });
  }
}

export class ActualizarClase {
  constructor(
    private readonly acceso: AccesoMaterias,
    private readonly clases: ClaseRepository,
  ) {}

  async ejecutar(
    id: string,
    cambios: CambiosClase,
    actor: Actor,
  ): Promise<Clase> {
    const clase = await buscarClase(this.clases, id);
    await this.acceso.paraEditar(clase.materiaId, actor);
    return (await this.clases.actualizar(id, cambios)) ?? clase;
  }
}

export class EliminarClase {
  constructor(
    private readonly acceso: AccesoMaterias,
    private readonly clases: ClaseRepository,
  ) {}

  async ejecutar(id: string, actor: Actor): Promise<void> {
    const clase = await buscarClase(this.clases, id);
    await this.acceso.paraEditar(clase.materiaId, actor);
    await this.clases.eliminar(id);
  }
}

export class ListarClasesDeMateria {
  constructor(
    private readonly acceso: AccesoMaterias,
    private readonly clases: ClaseRepository,
  ) {}

  async ejecutar(materiaId: string, actor: Actor): Promise<Clase[]> {
    await this.acceso.paraLeer(materiaId, actor);
    return this.clases.listarPorMateria(materiaId);
  }
}

export class ObtenerClaseDeSemana {
  constructor(
    private readonly acceso: AccesoMaterias,
    private readonly clases: ClaseRepository,
  ) {}

  async ejecutar(
    materiaId: string,
    semana: number,
    actor: Actor,
  ): Promise<Clase> {
    await this.acceso.paraLeer(materiaId, actor);
    const clase = await this.clases.buscarPorSemana(materiaId, semana);
    if (!clase) {
      throw new NoEncontradoError(
        `El maestro aún no publica el contenido de la semana ${semana}`,
      );
    }
    return clase;
  }
}

async function buscarClase(
  clases: ClaseRepository,
  id: string,
): Promise<Clase> {
  const clase = await clases.buscarPorId(id);
  if (!clase) {
    throw new NoEncontradoError('Contenido no encontrado');
  }
  return clase;
}
