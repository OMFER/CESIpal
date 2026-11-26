import { Actor, Rol } from '../../../shared/domain/actor';
import { Bitacora } from '../../../shared/domain/bitacora';
import {
  DatosInvalidosError,
  NoEncontradoError,
} from '../../../shared/domain/errores';
import { PublicadorEventos } from '../../../shared/domain/eventos';
import { UsuarioRepository } from '../../usuarios/domain/usuario.repository';
import { Materia } from '../domain/materia';
import { Plan, validarBloque, validarEstructuraEditable } from '../domain/plan';
import {
  CambiosMateria,
  DatosMateria,
  MateriaRepository,
} from '../domain/materia.repository';
import { PlanRepository } from '../domain/plan.repository';
import { AccesoMaterias, buscarPlan, ContextoMateria } from './acceso';

async function validarMaestro(
  usuarios: UsuarioRepository,
  maestroId: string,
): Promise<void> {
  const maestro = await usuarios.buscarPorId(maestroId);
  if (!maestro || maestro.rol !== Rol.MAESTRO) {
    throw new DatosInvalidosError('maestroId no corresponde a un maestro');
  }
}

async function buscarMateria(
  materias: MateriaRepository,
  id: string,
): Promise<Materia> {
  const materia = await materias.buscarPorId(id);
  if (!materia) {
    throw new NoEncontradoError('Materia no encontrada');
  }
  return materia;
}

export class CrearMateria {
  constructor(
    private readonly planes: PlanRepository,
    private readonly materias: MateriaRepository,
    private readonly usuarios: UsuarioRepository,
    private readonly bitacora: Bitacora,
  ) {}

  async ejecutar(datos: DatosMateria, actor: Actor): Promise<Materia> {
    const plan = await buscarPlan(this.planes, datos.planId);
    validarEstructuraEditable(plan);
    validarBloque(datos.bloque);
    if (datos.maestroId) await validarMaestro(this.usuarios, datos.maestroId);

    const materia = await this.materias.crear({
      ...datos,
      nombre: datos.nombre.trim(),
    });
    await this.bitacora.registrar({
      planId: plan.id,
      entidad: 'materia',
      entidadId: materia.id,
      accion: 'crear',
      autorId: actor.id,
      despues: materia,
    });
    return materia;
  }
}

/**
 * El nombre, la descripción y el maestro se corrigen en cualquier momento;
 * cambiar de bloque altera el calendario, así que solo se permite en borrador.
 */
export class ActualizarMateria {
  constructor(
    private readonly planes: PlanRepository,
    private readonly materias: MateriaRepository,
    private readonly usuarios: UsuarioRepository,
    private readonly bitacora: Bitacora,
  ) {}

  async ejecutar(
    id: string,
    cambios: CambiosMateria,
    actor: Actor,
  ): Promise<Materia> {
    const antes = await buscarMateria(this.materias, id);
    const plan = await buscarPlan(this.planes, antes.planId);
    if (cambios.bloque !== undefined && cambios.bloque !== antes.bloque) {
      validarEstructuraEditable(plan);
      validarBloque(cambios.bloque);
    }
    if (cambios.maestroId)
      await validarMaestro(this.usuarios, cambios.maestroId);

    const materia =
      (await this.materias.actualizar(id, {
        ...cambios,
        ...(cambios.nombre !== undefined && { nombre: cambios.nombre.trim() }),
      })) ?? antes;
    await this.bitacora.registrar({
      planId: plan.id,
      entidad: 'materia',
      entidadId: id,
      accion: 'actualizar',
      autorId: actor.id,
      antes,
      despues: materia,
    });
    return materia;
  }
}

export class EliminarMateria {
  constructor(
    private readonly planes: PlanRepository,
    private readonly materias: MateriaRepository,
    private readonly bitacora: Bitacora,
    private readonly eventos: PublicadorEventos,
  ) {}

  async ejecutar(id: string, actor: Actor): Promise<void> {
    const materia = await buscarMateria(this.materias, id);
    const plan = await buscarPlan(this.planes, materia.planId);
    validarEstructuraEditable(plan);
    await this.materias.eliminar(id);
    await this.bitacora.registrar({
      planId: plan.id,
      entidad: 'materia',
      entidadId: id,
      accion: 'eliminar',
      autorId: actor.id,
      antes: materia,
    });
    await this.eventos.publicar({ tipo: 'MateriaEliminada', materiaId: id });
  }
}

export class ObtenerMateria {
  constructor(private readonly acceso: AccesoMaterias) {}

  ejecutar(id: string, actor: Actor): Promise<ContextoMateria> {
    return this.acceso.paraLeer(id, actor);
  }
}

// Lo que ve un maestro al entrar: las materias que tiene asignadas, con su versión del plan
export class ListarMisMaterias {
  constructor(
    private readonly materias: MateriaRepository,
    private readonly planes: PlanRepository,
  ) {}

  async ejecutar(actor: Actor): Promise<ContextoMateria[]> {
    const materias = await this.materias.listarPorMaestro(actor.id);
    const planes = await this.planes.buscarPorIds([
      ...new Set(materias.map((m) => m.planId)),
    ]);
    return materias
      .map((materia) => ({
        materia,
        plan: planes.find((p) => p.id === materia.planId),
      }))
      .filter((c): c is { materia: Materia; plan: Plan } => !!c.plan);
  }
}
