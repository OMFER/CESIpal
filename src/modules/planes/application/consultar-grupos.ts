import { Actor, Rol } from '../../../shared/domain/actor';
import { Reloj } from '../../../shared/domain/reloj';
import { UsuarioRepository } from '../../usuarios/domain/usuario.repository';
import { Grupo } from '../domain/grupo';
import { Plan } from '../domain/plan';
import { GrupoRepository } from '../domain/grupo.repository';
import { PlanRepository } from '../domain/plan.repository';
import { MateriaRepository } from '../domain/materia.repository';
import { InscripcionRepository } from '../domain/inscripcion.repository';
import {
  calcularSemanaActual,
  generarSemanas,
  SemanaCalendario,
  totalSemanas,
} from '../domain/calendario';
import { AccesoGrupos } from './acceso';
import { conMaestros, MateriaConMaestro } from './gestionar-planes';

export interface GrupoDetallado {
  grupo: Grupo;
  plan: Plan | null;
  materias: MateriaConMaestro[];
  semanaActual: number;
  semanas: SemanaCalendario[];
}

// Junta cada grupo con su plan, sus materias y su calendario semanal
class DetalleDeGrupos {
  constructor(
    private readonly planes: PlanRepository,
    private readonly materias: MateriaRepository,
    private readonly usuarios: UsuarioRepository,
    private readonly reloj: Reloj,
  ) {}

  async detallar(grupos: Grupo[]): Promise<GrupoDetallado[]> {
    const planIds = [...new Set(grupos.map((g) => g.planId))];
    const [planes, materiasPorPlan] = await Promise.all([
      this.planes.buscarPorIds(planIds),
      Promise.all(
        planIds.map(async (id) =>
          conMaestros(this.usuarios, await this.materias.listarPorPlan(id)),
        ),
      ),
    ]);
    const hoy = this.reloj.ahora();

    return grupos.map((grupo) => {
      const materias = materiasPorPlan[planIds.indexOf(grupo.planId)];
      const total = totalSemanas(materias.map((m) => m.materia));
      return {
        grupo,
        plan: planes.find((p) => p.id === grupo.planId) ?? null,
        materias,
        semanaActual: calcularSemanaActual(grupo.fechaInicio, total, hoy),
        semanas: generarSemanas(grupo.fechaInicio, total, hoy),
      };
    });
  }
}

export class ListarGrupos {
  private readonly detalle: DetalleDeGrupos;

  constructor(
    private readonly grupos: GrupoRepository,
    planes: PlanRepository,
    materias: MateriaRepository,
    usuarios: UsuarioRepository,
    reloj: Reloj,
  ) {
    this.detalle = new DetalleDeGrupos(planes, materias, usuarios, reloj);
  }

  async ejecutar(): Promise<GrupoDetallado[]> {
    return this.detalle.detallar(await this.grupos.listar());
  }
}

// Lo que consume el dashboard: los grupos del actor con su calendario, del más reciente al más antiguo
export class ObtenerMisGrupos {
  private readonly detalle: DetalleDeGrupos;

  constructor(
    private readonly grupos: GrupoRepository,
    private readonly inscripciones: InscripcionRepository,
    planes: PlanRepository,
    private readonly materias: MateriaRepository,
    usuarios: UsuarioRepository,
    reloj: Reloj,
  ) {
    this.detalle = new DetalleDeGrupos(planes, materias, usuarios, reloj);
  }

  async ejecutar(actor: Actor): Promise<GrupoDetallado[]> {
    const grupos = await this.gruposDe(actor);
    const detallados = await this.detalle.detallar(grupos);
    return detallados.sort(
      (a, b) => b.grupo.fechaInicio.getTime() - a.grupo.fechaInicio.getTime(),
    );
  }

  private async gruposDe(actor: Actor): Promise<Grupo[]> {
    switch (actor.rol) {
      case Rol.MAESTRO: {
        const materias = await this.materias.listarPorMaestro(actor.id);
        return this.grupos.listarPorPlanes([
          ...new Set(materias.map((m) => m.planId)),
        ]);
      }
      case Rol.ALUMNO:
        return this.grupos.buscarPorIds(
          await this.inscripciones.gruposDeAlumno(actor.id),
        );
      case Rol.ADMIN:
        return this.grupos.listar();
    }
  }
}

export class ObtenerGrupo {
  private readonly detalle: DetalleDeGrupos;

  constructor(
    private readonly acceso: AccesoGrupos,
    planes: PlanRepository,
    materias: MateriaRepository,
    usuarios: UsuarioRepository,
    reloj: Reloj,
  ) {
    this.detalle = new DetalleDeGrupos(planes, materias, usuarios, reloj);
  }

  async ejecutar(id: string, actor: Actor): Promise<GrupoDetallado> {
    const { grupo } = await this.acceso.paraLeer(id, actor);
    const [detallado] = await this.detalle.detallar([grupo]);
    return detallado;
  }
}
