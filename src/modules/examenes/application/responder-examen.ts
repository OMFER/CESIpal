import { Actor, Rol } from '../../../shared/domain/actor';
import {
  ConflictoError,
  SinPermisoError,
} from '../../../shared/domain/errores';
import { Reloj } from '../../../shared/domain/reloj';
import { AccesoMaterias } from '../../materias/application/acceso-materias';
import { Usuario } from '../../usuarios/domain/usuario';
import { UsuarioRepository } from '../../usuarios/domain/usuario.repository';
import { validarQuePuedeResponder } from '../domain/examen';
import { calificarExamen } from '../domain/calificar';
import { Intento } from '../domain/intento';
import {
  ExamenRepository,
  IntentoRepository,
} from '../domain/examen.repository';
import { buscarExamen } from './gestionar-examenes';

export class ResponderExamen {
  constructor(
    private readonly acceso: AccesoMaterias,
    private readonly examenes: ExamenRepository,
    private readonly intentos: IntentoRepository,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(
    examenId: string,
    respuestas: number[],
    actor: Actor,
  ): Promise<Intento> {
    if (actor.rol !== Rol.ALUMNO) {
      throw new SinPermisoError('Solo los alumnos pueden responder exámenes');
    }
    const examen = await buscarExamen(this.examenes, examenId);
    await this.acceso.paraLeer(examen.materiaId, actor);
    validarQuePuedeResponder(examen, respuestas, this.reloj.ahora());

    if (await this.intentos.buscar(examenId, actor.id)) {
      throw new ConflictoError('Ya respondiste este examen');
    }
    return this.intentos.crear({
      examenId,
      alumnoId: actor.id,
      respuestas,
      ...calificarExamen(examen.preguntas, respuestas, examen.puntajeMaximo),
    });
  }
}

export interface IntentoConAlumno {
  intento: Intento;
  alumno: Usuario | null;
}

// El maestro ve los resultados de todos sus alumnos; un alumno, solo el suyo
export class ListarIntentos {
  constructor(
    private readonly acceso: AccesoMaterias,
    private readonly examenes: ExamenRepository,
    private readonly intentos: IntentoRepository,
    private readonly usuarios: UsuarioRepository,
  ) {}

  async ejecutar(examenId: string, actor: Actor): Promise<IntentoConAlumno[]> {
    const examen = await buscarExamen(this.examenes, examenId);
    await this.acceso.paraLeer(examen.materiaId, actor);

    const intentos =
      actor.rol === Rol.ALUMNO
        ? [await this.intentos.buscar(examenId, actor.id)].filter(
            (i): i is Intento => i !== null,
          )
        : await this.intentos.listarPorExamen(examenId);
    const alumnos = await this.usuarios.buscarPorIds(
      intentos.map((i) => i.alumnoId),
    );
    return intentos.map((intento) => ({
      intento,
      alumno: alumnos.find((a) => a.id === intento.alumnoId) ?? null,
    }));
  }
}
