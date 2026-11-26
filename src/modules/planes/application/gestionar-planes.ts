import { Actor } from '../../../shared/domain/actor';
import { Bitacora, Cambio } from '../../../shared/domain/bitacora';
import {
  ConflictoError,
  DatosInvalidosError,
} from '../../../shared/domain/errores';
import { PublicadorEventos } from '../../../shared/domain/eventos';
import { Usuario } from '../../usuarios/domain/usuario';
import { UsuarioRepository } from '../../usuarios/domain/usuario.repository';
import { EstadoPlan, nombreDePlan, Plan } from '../domain/plan';
import { Materia } from '../domain/materia';
import { CambiosPlan, PlanRepository } from '../domain/plan.repository';
import { MateriaRepository } from '../domain/materia.repository';
import { GrupoRepository } from '../domain/grupo.repository';
import { buscarPlan } from './acceso';

export interface NuevoPlan {
  nombre: string;
  descripcion?: string;
}

export class CrearPlan {
  constructor(
    private readonly planes: PlanRepository,
    private readonly bitacora: Bitacora,
  ) {}

  async ejecutar(datos: NuevoPlan, actor: Actor): Promise<Plan> {
    const nombre = datos.nombre.trim();
    if (!nombre) {
      throw new DatosInvalidosError('El plan necesita un nombre');
    }
    if ((await this.planes.ultimaVersion(nombre)) > 0) {
      throw new ConflictoError(
        `Ya existe un plan llamado "${nombre}"; crea una nueva versión de él`,
      );
    }
    const plan = await this.planes.crear({
      nombre,
      descripcion: datos.descripcion,
      version: 1,
      estado: EstadoPlan.BORRADOR,
    });
    await this.bitacora.registrar({
      planId: plan.id,
      entidad: 'plan',
      entidadId: plan.id,
      accion: 'crear',
      autorId: actor.id,
      despues: plan,
    });
    return plan;
  }
}

// La descripción es solo informativa: se corrige aunque el plan esté publicado
export class ActualizarPlan {
  constructor(
    private readonly planes: PlanRepository,
    private readonly bitacora: Bitacora,
  ) {}

  async ejecutar(
    id: string,
    cambios: Pick<CambiosPlan, 'descripcion'>,
    actor: Actor,
  ): Promise<Plan> {
    const antes = await buscarPlan(this.planes, id);
    const plan = (await this.planes.actualizar(id, cambios)) ?? antes;
    await this.bitacora.registrar({
      planId: id,
      entidad: 'plan',
      entidadId: id,
      accion: 'actualizar',
      autorId: actor.id,
      antes: { descripcion: antes.descripcion },
      despues: { descripcion: plan.descripcion },
    });
    return plan;
  }
}

// Solo se borra un plan que ningún grupo usa; su contenido y exámenes se van con sus materias
export class EliminarPlan {
  constructor(
    private readonly planes: PlanRepository,
    private readonly materias: MateriaRepository,
    private readonly grupos: GrupoRepository,
    private readonly bitacora: Bitacora,
    private readonly eventos: PublicadorEventos,
  ) {}

  async ejecutar(id: string): Promise<void> {
    const plan = await buscarPlan(this.planes, id);
    if (await this.grupos.existeDePlan(id)) {
      throw new ConflictoError(
        `${nombreDePlan(plan)} tiene grupos; elimínalos antes de borrar el plan`,
      );
    }
    for (const materia of await this.materias.listarPorPlan(id)) {
      await this.materias.eliminar(materia.id);
      await this.eventos.publicar({
        tipo: 'MateriaEliminada',
        materiaId: materia.id,
      });
    }
    await this.planes.eliminar(id);
    await this.bitacora.eliminarDePlan(id);
  }
}

export class ListarPlanes {
  constructor(private readonly planes: PlanRepository) {}

  ejecutar(): Promise<Plan[]> {
    return this.planes.listar();
  }
}

export interface MateriaConMaestro {
  materia: Materia;
  maestro: Usuario | null;
}

export interface PlanDetallado {
  plan: Plan;
  materias: MateriaConMaestro[];
}

export class ObtenerPlan {
  constructor(
    private readonly planes: PlanRepository,
    private readonly materias: MateriaRepository,
    private readonly usuarios: UsuarioRepository,
  ) {}

  async ejecutar(id: string): Promise<PlanDetallado> {
    const plan = await buscarPlan(this.planes, id);
    const materias = await this.materias.listarPorPlan(id);
    return { plan, materias: await conMaestros(this.usuarios, materias) };
  }
}

export async function conMaestros(
  usuarios: UsuarioRepository,
  materias: Materia[],
): Promise<MateriaConMaestro[]> {
  const ids = [
    ...new Set(materias.flatMap((m) => (m.maestroId ? [m.maestroId] : []))),
  ];
  const maestros = await usuarios.buscarPorIds(ids);
  return materias.map((materia) => ({
    materia,
    maestro: maestros.find((u) => u.id === materia.maestroId) ?? null,
  }));
}

export class ConsultarBitacora {
  constructor(
    private readonly planes: PlanRepository,
    private readonly bitacora: Bitacora,
  ) {}

  async ejecutar(planId: string): Promise<Cambio[]> {
    await buscarPlan(this.planes, planId);
    return this.bitacora.listarDePlan(planId);
  }
}
