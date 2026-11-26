import { Actor, Rol } from '../../../shared/domain/actor';
import { NoEncontradoError } from '../../../shared/domain/errores';
import { AccesoGrupos } from '../../planes/application/acceso';
import { InscripcionRepository } from '../../planes/domain/inscripcion.repository';
import { Materia } from '../../planes/domain/materia';
import { Usuario } from '../../usuarios/domain/usuario';
import { UsuarioRepository } from '../../usuarios/domain/usuario.repository';
import { Boleta, construirBoleta } from '../domain/boleta';
import { Intento } from '../domain/intento';
import {
  ExamenRepository,
  IntentoRepository,
} from '../domain/examen.repository';
import { buscarExamen } from './gestionar-examenes';

export interface IntentoConAlumno {
  intento: Intento;
  alumno: Usuario | null;
}

// El maestro y el admin ven los resultados de todo el grupo; un alumno, solo el suyo
export class ListarIntentosDeGrupo {
  constructor(
    private readonly acceso: AccesoGrupos,
    private readonly examenes: ExamenRepository,
    private readonly intentos: IntentoRepository,
    private readonly usuarios: UsuarioRepository,
  ) {}

  async ejecutar(
    grupoId: string,
    examenId: string,
    actor: Actor,
  ): Promise<IntentoConAlumno[]> {
    const { materias } = await this.acceso.paraLeer(grupoId, actor);
    const examen = await buscarExamen(this.examenes, examenId);
    if (!materias.some((m) => m.id === examen.materiaId)) {
      throw new NoEncontradoError(
        'El examen no pertenece al plan de este grupo',
      );
    }

    const delGrupo = await this.intentos.listarDeGrupo(grupoId, examenId);
    const intentos =
      actor.rol === Rol.ALUMNO
        ? delGrupo.filter((i) => i.alumnoId === actor.id)
        : delGrupo;
    const alumnos = await this.usuarios.buscarPorIds(
      intentos.map((i) => i.alumnoId),
    );
    return intentos.map((intento) => ({
      intento,
      alumno: alumnos.find((a) => a.id === intento.alumnoId) ?? null,
    }));
  }
}

export interface BoletaDeAlumno extends Boleta {
  alumno: Usuario;
}

export interface CalificacionesDeGrupo {
  // En el orden en que se cursan
  materias: Materia[];
  boletas: BoletaDeAlumno[];
}

export class ObtenerCalificaciones {
  constructor(
    private readonly acceso: AccesoGrupos,
    private readonly inscripciones: InscripcionRepository,
    private readonly examenes: ExamenRepository,
    private readonly intentos: IntentoRepository,
    private readonly usuarios: UsuarioRepository,
  ) {}

  async ejecutar(
    grupoId: string,
    actor: Actor,
  ): Promise<CalificacionesDeGrupo> {
    const { materias } = await this.acceso.paraLeer(grupoId, actor);
    const materiaIds = materias.map((m) => m.id);
    const [examenes, intentos] = await Promise.all([
      this.examenes.listarPorMaterias(materiaIds),
      this.intentos.listarDeGrupo(grupoId),
    ]);

    const alumnos =
      actor.rol === Rol.ALUMNO
        ? await this.usuarios.buscarPorIds([actor.id])
        : await this.inscripciones.alumnosDeGrupo(grupoId);
    return {
      materias,
      boletas: alumnos.map((alumno) => ({
        alumno,
        ...construirBoleta(
          materiaIds,
          examenes,
          intentos.filter((i) => i.alumnoId === alumno.id),
        ),
      })),
    };
  }
}
