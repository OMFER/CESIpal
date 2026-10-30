import { Actor, Rol } from '../../../shared/domain/actor';
import { Reloj } from '../../../shared/domain/reloj';
import { UsuarioRepository } from '../../usuarios/domain/usuario.repository';
import { Materia } from '../domain/materia';
import { MateriaRepository } from '../domain/materia.repository';
import { InscripcionRepository } from '../domain/inscripcion.repository';
import { AccesoMaterias } from './acceso-materias';
import {
  conCalendario,
  conMaestros,
  MateriaConCalendario,
} from './vistas-materia';

// Lo que consume el dashboard: las materias del actor con su calendario semanal
export class ObtenerMisMaterias {
  constructor(
    private readonly materias: MateriaRepository,
    private readonly inscripciones: InscripcionRepository,
    private readonly usuarios: UsuarioRepository,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(actor: Actor): Promise<MateriaConCalendario[]> {
    const hoy = this.reloj.ahora();
    const vistas = await conMaestros(
      await this.materiasDe(actor),
      this.usuarios,
    );
    return vistas
      .sort((a, b) => a.materia.nombre.localeCompare(b.materia.nombre))
      .map((vista) => conCalendario(vista, hoy));
  }

  private async materiasDe(actor: Actor): Promise<Materia[]> {
    switch (actor.rol) {
      case Rol.MAESTRO:
        return this.materias.listarPorMaestro(actor.id);
      case Rol.ALUMNO:
        return this.materias.buscarPorIds(
          await this.inscripciones.materiasDeAlumno(actor.id),
        );
      case Rol.ADMIN:
        return this.materias.listar();
    }
  }
}

export class ObtenerMateria {
  constructor(
    private readonly acceso: AccesoMaterias,
    private readonly usuarios: UsuarioRepository,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(id: string, actor: Actor): Promise<MateriaConCalendario> {
    const materia = await this.acceso.paraLeer(id, actor);
    const [vista] = await conMaestros([materia], this.usuarios);
    return conCalendario(vista, this.reloj.ahora());
  }
}
