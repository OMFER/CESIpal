import { Actor, Rol } from '../../../shared/domain/actor';
import { Reloj } from '../../../shared/domain/reloj';
import { Usuario } from '../../usuarios/domain/usuario';
import { UsuarioRepository } from '../../usuarios/domain/usuario.repository';
import { Grupo } from '../domain/grupo';
import { Materia } from '../domain/materia';
import { GrupoRepository } from '../domain/grupo.repository';
import { MateriaRepository } from '../domain/materia.repository';
import { InscripcionRepository } from '../domain/inscripcion.repository';
import {
  calcularSemanaActual,
  generarSemanas,
  SemanaCalendario,
} from '../domain/calendario';
import { AccesoGrupos } from './acceso';

export interface GrupoDetallado {
  grupo: Grupo;
  materia: Materia | null;
  maestro: Usuario | null;
  semanaActual: number;
  semanas: SemanaCalendario[];
}

// Junta cada grupo con su materia, su maestro y su calendario semanal
class DetalleDeGrupos {
  constructor(
    private readonly materias: MateriaRepository,
    private readonly usuarios: UsuarioRepository,
    private readonly reloj: Reloj,
  ) {}

  async detallar(grupos: Grupo[]): Promise<GrupoDetallado[]> {
    const unicos = (ids: string[]) => [...new Set(ids)];
    const [materias, maestros] = await Promise.all([
      this.materias.buscarPorIds(unicos(grupos.map((g) => g.materiaId))),
      this.usuarios.buscarPorIds(unicos(grupos.map((g) => g.maestroId))),
    ]);
    const hoy = this.reloj.ahora();

    return grupos.map((grupo) => {
      const materia = materias.find((m) => m.id === grupo.materiaId) ?? null;
      const totalSemanas = materia?.totalSemanas ?? 0;
      return {
        grupo,
        materia,
        maestro: maestros.find((u) => u.id === grupo.maestroId) ?? null,
        semanaActual: calcularSemanaActual(
          grupo.fechaInicio,
          totalSemanas,
          hoy,
        ),
        semanas: generarSemanas(grupo.fechaInicio, totalSemanas, hoy),
      };
    });
  }
}

export class ListarGrupos {
  private readonly detalle: DetalleDeGrupos;

  constructor(
    private readonly grupos: GrupoRepository,
    materias: MateriaRepository,
    usuarios: UsuarioRepository,
    reloj: Reloj,
  ) {
    this.detalle = new DetalleDeGrupos(materias, usuarios, reloj);
  }

  async ejecutar(): Promise<GrupoDetallado[]> {
    return this.detalle.detallar(await this.grupos.listar());
  }
}

// Lo que consume el dashboard: los grupos del actor con su calendario semanal
export class ObtenerMisGrupos {
  private readonly detalle: DetalleDeGrupos;

  constructor(
    private readonly grupos: GrupoRepository,
    private readonly inscripciones: InscripcionRepository,
    materias: MateriaRepository,
    usuarios: UsuarioRepository,
    reloj: Reloj,
  ) {
    this.detalle = new DetalleDeGrupos(materias, usuarios, reloj);
  }

  async ejecutar(actor: Actor): Promise<GrupoDetallado[]> {
    const detallados = await this.detalle.detallar(await this.gruposDe(actor));
    return detallados.sort((a, b) =>
      (a.materia?.nombre ?? '').localeCompare(b.materia?.nombre ?? ''),
    );
  }

  private async gruposDe(actor: Actor): Promise<Grupo[]> {
    switch (actor.rol) {
      case Rol.MAESTRO:
        return this.grupos.listarPorMaestro(actor.id);
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
    materias: MateriaRepository,
    usuarios: UsuarioRepository,
    reloj: Reloj,
  ) {
    this.detalle = new DetalleDeGrupos(materias, usuarios, reloj);
  }

  async ejecutar(id: string, actor: Actor): Promise<GrupoDetallado> {
    const { grupo } = await this.acceso.paraLeer(id, actor);
    const [detallado] = await this.detalle.detallar([grupo]);
    return detallado;
  }
}
