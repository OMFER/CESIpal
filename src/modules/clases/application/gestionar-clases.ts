import { Actor } from '../../../shared/domain/actor';
import { Bitacora } from '../../../shared/domain/bitacora';
import {
  ConflictoError,
  NoEncontradoError,
} from '../../../shared/domain/errores';
import {
  validarEstructuraEditable,
  validarSemanaDeMateria,
} from '../../planes/domain/plan';
import { AccesoMaterias } from '../../planes/application/acceso';
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
    private readonly bitacora: Bitacora,
  ) {}

  async ejecutar(datos: NuevaClase, actor: Actor): Promise<Clase> {
    const { plan } = await this.acceso.paraEditar(datos.materiaId, actor);
    validarEstructuraEditable(plan);
    validarSemanaDeMateria(datos.semana);
    if (await this.clases.buscarPorSemana(datos.materiaId, datos.semana)) {
      throw new ConflictoError(
        `La semana ${datos.semana} ya tiene contenido; edítalo en lugar de crear otro`,
      );
    }
    const clase = await this.clases.crear({
      ...datos,
      recursos: datos.recursos ?? [],
    });
    await this.bitacora.registrar({
      planId: plan.id,
      entidad: 'clase',
      entidadId: clase.id,
      accion: 'crear',
      autorId: actor.id,
      despues: clase,
    });
    return clase;
  }
}

// Textos, recursos y ligas son correcciones: se permiten aunque el plan ya esté publicado
export class ActualizarClase {
  constructor(
    private readonly acceso: AccesoMaterias,
    private readonly clases: ClaseRepository,
    private readonly bitacora: Bitacora,
  ) {}

  async ejecutar(
    id: string,
    cambios: CambiosClase,
    actor: Actor,
  ): Promise<Clase> {
    const antes = await buscarClase(this.clases, id);
    const { plan } = await this.acceso.paraEditar(antes.materiaId, actor);
    const clase = (await this.clases.actualizar(id, cambios)) ?? antes;
    await this.bitacora.registrar({
      planId: plan.id,
      entidad: 'clase',
      entidadId: id,
      accion: 'actualizar',
      autorId: actor.id,
      antes,
      despues: clase,
    });
    return clase;
  }
}

export class EliminarClase {
  constructor(
    private readonly acceso: AccesoMaterias,
    private readonly clases: ClaseRepository,
    private readonly bitacora: Bitacora,
  ) {}

  async ejecutar(id: string, actor: Actor): Promise<void> {
    const clase = await buscarClase(this.clases, id);
    const { plan } = await this.acceso.paraEditar(clase.materiaId, actor);
    validarEstructuraEditable(plan);
    await this.clases.eliminar(id);
    await this.bitacora.registrar({
      planId: plan.id,
      entidad: 'clase',
      entidadId: id,
      accion: 'eliminar',
      autorId: actor.id,
      antes: clase,
    });
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
        `La semana ${semana} de esta materia aún no tiene contenido`,
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
