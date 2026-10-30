import { Actor, Rol } from '../../../shared/domain/actor';
import { NoEncontradoError } from '../../../shared/domain/errores';
import { AccesoMaterias } from '../../materias/application/acceso-materias';
import { Examen, puedeVerRespuestas } from '../domain/examen';
import { Intento } from '../domain/intento';
import {
  ExamenRepository,
  IntentoRepository,
} from '../domain/examen.repository';
import { buscarExamen } from './gestionar-examenes';

// Lo que un actor puede ver de un examen: el alumno sin respuestas correctas y con su propio intento
export interface VistaExamen {
  examen: Examen;
  conRespuestas: boolean;
  // Solo para alumnos: null si todavía no responde
  miIntento?: Intento | null;
}

abstract class ConsultaExamen {
  constructor(
    protected readonly acceso: AccesoMaterias,
    protected readonly examenes: ExamenRepository,
    protected readonly intentos: IntentoRepository,
  ) {}

  protected async vistaPara(
    examen: Examen,
    actor: Actor,
  ): Promise<VistaExamen> {
    if (actor.rol !== Rol.ALUMNO) {
      return { examen, conRespuestas: puedeVerRespuestas(actor) };
    }
    return {
      examen,
      conRespuestas: false,
      miIntento: await this.intentos.buscar(examen.id, actor.id),
    };
  }
}

export class ObtenerExamen extends ConsultaExamen {
  async ejecutar(id: string, actor: Actor): Promise<VistaExamen> {
    const examen = await buscarExamen(this.examenes, id);
    await this.acceso.paraLeer(examen.materiaId, actor);
    return this.vistaPara(examen, actor);
  }
}

export class ObtenerExamenDeSemana extends ConsultaExamen {
  async ejecutar(
    materiaId: string,
    semana: number,
    actor: Actor,
  ): Promise<VistaExamen> {
    await this.acceso.paraLeer(materiaId, actor);
    const examen = await this.examenes.buscarPorSemana(materiaId, semana);
    if (!examen) {
      throw new NoEncontradoError(`La semana ${semana} no tiene examen`);
    }
    return this.vistaPara(examen, actor);
  }
}

export class ListarExamenesDeMateria extends ConsultaExamen {
  async ejecutar(materiaId: string, actor: Actor): Promise<VistaExamen[]> {
    await this.acceso.paraLeer(materiaId, actor);
    const examenes = await this.examenes.listarPorMateria(materiaId);
    if (actor.rol !== Rol.ALUMNO) {
      return examenes.map((examen) => ({ examen, conRespuestas: true }));
    }

    const intentos = await this.intentos.listarDeAlumno(
      actor.id,
      examenes.map((e) => e.id),
    );
    return examenes.map((examen) => ({
      examen,
      conRespuestas: false,
      miIntento: intentos.find((i) => i.examenId === examen.id) ?? null,
    }));
  }
}
