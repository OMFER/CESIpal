import { Actor, Rol } from '../../../shared/domain/actor';
import {
  NoEncontradoError,
  SinPermisoError,
} from '../../../shared/domain/errores';
import { Plan } from '../domain/plan';
import { Materia } from '../domain/materia';
import { Grupo } from '../domain/grupo';
import { PlanRepository } from '../domain/plan.repository';
import { MateriaRepository } from '../domain/materia.repository';
import { GrupoRepository } from '../domain/grupo.repository';
import { InscripcionRepository } from '../domain/inscripcion.repository';
import {
  puedeEditarMateria,
  puedeVerGrupo,
  puedeVerMateria,
} from '../domain/politica-acceso';

export async function buscarPlan(
  planes: PlanRepository,
  id: string,
): Promise<Plan> {
  const plan = await planes.buscarPorId(id);
  if (!plan) {
    throw new NoEncontradoError('Plan de estudios no encontrado');
  }
  return plan;
}

export interface ContextoMateria {
  materia: Materia;
  plan: Plan;
}

// Punto único donde se decide si un actor puede leer o corregir una materia, su contenido y sus exámenes
export class AccesoMaterias {
  constructor(
    private readonly materias: MateriaRepository,
    private readonly planes: PlanRepository,
    private readonly grupos: GrupoRepository,
    private readonly inscripciones: InscripcionRepository,
  ) {}

  async paraLeer(materiaId: string, actor: Actor): Promise<ContextoMateria> {
    const contexto = await this.buscar(materiaId);
    const cursa =
      actor.rol === Rol.ALUMNO &&
      (await this.cursaElPlan(actor.id, contexto.plan.id));
    if (!puedeVerMateria(actor, contexto.materia, cursa)) {
      throw new SinPermisoError(
        actor.rol === Rol.ALUMNO
          ? 'No estás inscrito en un grupo que curse esta materia'
          : 'No tienes asignada esta materia',
      );
    }
    return contexto;
  }

  async paraEditar(materiaId: string, actor: Actor): Promise<ContextoMateria> {
    const contexto = await this.buscar(materiaId);
    if (!puedeEditarMateria(actor, contexto.materia)) {
      throw new SinPermisoError(
        'Solo el maestro asignado a la materia o el admin pueden modificarla',
      );
    }
    return contexto;
  }

  private async cursaElPlan(alumnoId: string, planId: string) {
    const grupos = await this.grupos.buscarPorIds(
      await this.inscripciones.gruposDeAlumno(alumnoId),
    );
    return grupos.some((g) => g.planId === planId);
  }

  private async buscar(materiaId: string): Promise<ContextoMateria> {
    const materia = await this.materias.buscarPorId(materiaId);
    if (!materia) {
      throw new NoEncontradoError('Materia no encontrada');
    }
    return { materia, plan: await buscarPlan(this.planes, materia.planId) };
  }
}

export interface ContextoGrupo {
  grupo: Grupo;
  plan: Plan;
  // Las materias del plan, por bloque
  materias: Materia[];
}

// Punto único donde se decide si un actor puede ver lo que ocurre en un grupo
export class AccesoGrupos {
  constructor(
    private readonly grupos: GrupoRepository,
    private readonly planes: PlanRepository,
    private readonly materias: MateriaRepository,
    private readonly inscripciones: InscripcionRepository,
  ) {}

  async paraLeer(grupoId: string, actor: Actor): Promise<ContextoGrupo> {
    const grupo = await this.grupos.buscarPorId(grupoId);
    if (!grupo) {
      throw new NoEncontradoError('Grupo no encontrado');
    }
    const materias = await this.materias.listarPorPlan(grupo.planId);
    const inscrito =
      actor.rol === Rol.ALUMNO &&
      (await this.inscripciones.estaInscrito(actor.id, grupoId));
    const imparte = materias.some((m) => m.maestroId === actor.id);
    if (!puedeVerGrupo(actor, { inscrito, imparte })) {
      throw new SinPermisoError(
        actor.rol === Rol.ALUMNO
          ? 'No estás inscrito en este grupo'
          : 'No tienes materias en el plan de este grupo',
      );
    }
    return {
      grupo,
      plan: await buscarPlan(this.planes, grupo.planId),
      materias,
    };
  }
}
