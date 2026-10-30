import { Actor, Rol } from '../../../shared/domain/actor';
import {
  ConflictoError,
  NoEncontradoError,
  SinPermisoError,
} from '../../../shared/domain/errores';
import { Reloj } from '../../../shared/domain/reloj';
import { AccesoGrupos, ContextoGrupo } from '../../materias/application/acceso';
import { Examen, puedeVerRespuestas, TipoExamen } from '../domain/examen';
import { Intento } from '../domain/intento';
import {
  calcularVentana,
  validarQuePuedeResponder,
  Ventana,
} from '../domain/ventana';
import {
  calificarExamen,
  PreguntaRevisada,
  revisarRespuestas,
} from '../domain/calificar';
import {
  ExamenRepository,
  IntentoRepository,
} from '../domain/examen.repository';
import { buscarExamen } from './gestionar-examenes';

export interface ResumenExamen {
  examen: Examen;
  ventana: Ventana;
  // Solo para alumnos: null si todavía no responde
  miIntento?: Intento | null;
}

// Qué preguntas recibe el actor: con respuestas (maestro), sin ellas (alumno con examen abierto),
// ninguna (alumno fuera de la ventana) o la revisión de lo que contestó
export type PreguntasVisibles =
  | { modo: 'conRespuestas' }
  | { modo: 'sinRespuestas' }
  | { modo: 'ocultas' }
  | { modo: 'revision'; preguntas: PreguntaRevisada[] };

export interface ExamenEnGrupo extends ResumenExamen {
  preguntas: PreguntasVisibles;
}

const ORDEN_TIPO: Record<TipoExamen, number> = {
  [TipoExamen.SEMANAL]: 0,
  [TipoExamen.REPOSICION]: 1,
  [TipoExamen.FINAL]: 2,
};

// El Final va al último; los demás por semana, el Semanal antes que su Reposición
export const ordenarExamenes = (examenes: Examen[]) =>
  [...examenes].sort(
    (a, b) =>
      (a.semana ?? Infinity) - (b.semana ?? Infinity) ||
      ORDEN_TIPO[a.tipo] - ORDEN_TIPO[b.tipo],
  );

// Lo común a las consultas de exámenes dentro de un grupo
abstract class ConsultaEnGrupo {
  constructor(
    protected readonly acceso: AccesoGrupos,
    protected readonly examenes: ExamenRepository,
    protected readonly intentos: IntentoRepository,
    protected readonly reloj: Reloj,
  ) {}

  protected ventanaDe(
    examen: Examen,
    { grupo, materia }: ContextoGrupo,
    examenesDeMateria: Examen[],
  ): Ventana {
    const semanal =
      examen.tipo === TipoExamen.REPOSICION
        ? examenesDeMateria.find(
            (e) => e.tipo === TipoExamen.SEMANAL && e.semana === examen.semana,
          )
        : undefined;
    return calcularVentana(
      examen,
      { fechaInicio: grupo.fechaInicio, totalSemanas: materia.totalSemanas },
      this.reloj.ahora(),
      semanal?.diasExtra ?? 0,
    );
  }

  protected async resumir(
    examenes: Examen[],
    contexto: ContextoGrupo,
    actor: Actor,
  ): Promise<ResumenExamen[]> {
    const deMateria = await this.examenes.listarPorMateria(contexto.materia.id);
    const intentos =
      actor.rol === Rol.ALUMNO
        ? await this.intentos.listarDeAlumno(contexto.grupo.id, actor.id)
        : [];
    return examenes.map((examen) => ({
      examen,
      ventana: this.ventanaDe(examen, contexto, deMateria),
      ...(actor.rol === Rol.ALUMNO && {
        miIntento: intentos.find((i) => i.examenId === examen.id) ?? null,
      }),
    }));
  }

  protected async examenDelGrupo(
    examenId: string,
    contexto: ContextoGrupo,
  ): Promise<Examen> {
    const examen = await buscarExamen(this.examenes, examenId);
    if (examen.materiaId !== contexto.materia.id) {
      throw new NoEncontradoError(
        'El examen no pertenece a la materia de este grupo',
      );
    }
    return examen;
  }
}

export class ListarExamenesDeGrupo extends ConsultaEnGrupo {
  async ejecutar(grupoId: string, actor: Actor): Promise<ResumenExamen[]> {
    const contexto = await this.acceso.paraLeer(grupoId, actor);
    const examenes = ordenarExamenes(
      await this.examenes.listarPorMateria(contexto.materia.id),
    );
    return this.resumir(examenes, contexto, actor);
  }
}

export interface ExamenesDeSemana {
  semanal: ResumenExamen | null;
  reposicion: ResumenExamen | null;
}

export class ObtenerExamenesDeSemana extends ConsultaEnGrupo {
  async ejecutar(
    grupoId: string,
    semana: number,
    actor: Actor,
  ): Promise<ExamenesDeSemana> {
    const contexto = await this.acceso.paraLeer(grupoId, actor);
    const deLaSemana = (
      await this.examenes.listarPorMateria(contexto.materia.id)
    ).filter((e) => e.semana === semana);
    const resumenes = await this.resumir(deLaSemana, contexto, actor);
    const delTipo = (tipo: TipoExamen) =>
      resumenes.find((r) => r.examen.tipo === tipo) ?? null;
    return {
      semanal: delTipo(TipoExamen.SEMANAL),
      reposicion: delTipo(TipoExamen.REPOSICION),
    };
  }
}

export class ObtenerExamenEnGrupo extends ConsultaEnGrupo {
  async ejecutar(
    grupoId: string,
    examenId: string,
    actor: Actor,
  ): Promise<ExamenEnGrupo> {
    const contexto = await this.acceso.paraLeer(grupoId, actor);
    const examen = await this.examenDelGrupo(examenId, contexto);
    const [resumen] = await this.resumir([examen], contexto, actor);
    return { ...resumen, preguntas: this.preguntasVisibles(resumen, actor) };
  }

  private preguntasVisibles(
    { examen, ventana, miIntento }: ResumenExamen,
    actor: Actor,
  ): PreguntasVisibles {
    if (puedeVerRespuestas(actor)) return { modo: 'conRespuestas' };
    if (miIntento) {
      return {
        modo: 'revision',
        preguntas: revisarRespuestas(examen.preguntas, miIntento.respuestas),
      };
    }
    return ventana.estado === 'abierta'
      ? { modo: 'sinRespuestas' }
      : { modo: 'ocultas' };
  }
}

export interface ResultadoDeIntento {
  intento: Intento;
  revision: PreguntaRevisada[];
}

export class ResponderExamen extends ConsultaEnGrupo {
  async ejecutar(
    grupoId: string,
    examenId: string,
    respuestas: number[],
    actor: Actor,
  ): Promise<ResultadoDeIntento> {
    if (actor.rol !== Rol.ALUMNO) {
      throw new SinPermisoError('Solo los alumnos pueden responder exámenes');
    }
    const contexto = await this.acceso.paraLeer(grupoId, actor);
    const examen = await this.examenDelGrupo(examenId, contexto);
    const deMateria = await this.examenes.listarPorMateria(contexto.materia.id);
    validarQuePuedeResponder(
      examen,
      this.ventanaDe(examen, contexto, deMateria),
      respuestas,
    );

    if (await this.intentos.buscar(examenId, grupoId, actor.id)) {
      throw new ConflictoError('Ya respondiste este examen');
    }
    const intento = await this.intentos.crear({
      examenId,
      grupoId,
      alumnoId: actor.id,
      respuestas,
      ...calificarExamen(examen.preguntas, respuestas, examen.puntajeMaximo),
    });
    return {
      intento,
      revision: revisarRespuestas(examen.preguntas, respuestas),
    };
  }
}
