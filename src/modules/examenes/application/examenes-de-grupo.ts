import { Actor, Rol } from '../../../shared/domain/actor';
import {
  ConflictoError,
  NoEncontradoError,
  SinPermisoError,
} from '../../../shared/domain/errores';
import { Reloj } from '../../../shared/domain/reloj';
import { AccesoGrupos, ContextoGrupo } from '../../materias/application/acceso';
import {
  Examen,
  ordenarExamenes,
  puedeVerRespuestas,
  TipoExamen,
} from '../domain/examen';
import { Intento } from '../domain/intento';
import {
  calcularVentana,
  puedeRevelarRespuestas,
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

// Lo que necesita cualquier consulta: el grupo, su materia y los exámenes de esa materia
interface Consulta extends ContextoGrupo {
  examenesDeMateria: Examen[];
}

// Lo común a las consultas de exámenes dentro de un grupo
abstract class ConsultaEnGrupo {
  constructor(
    protected readonly acceso: AccesoGrupos,
    protected readonly examenes: ExamenRepository,
    protected readonly intentos: IntentoRepository,
    protected readonly reloj: Reloj,
    protected readonly zonaHoraria = 'UTC',
  ) {}

  protected async preparar(grupoId: string, actor: Actor): Promise<Consulta> {
    const contexto = await this.acceso.paraLeer(grupoId, actor);
    const examenesDeMateria = await this.examenes.listarPorMateria(
      contexto.materia.id,
    );
    return { ...contexto, examenesDeMateria };
  }

  protected ventanaDe(examen: Examen, consulta: Consulta): Ventana {
    const { grupo, materia, examenesDeMateria } = consulta;
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
    consulta: Consulta,
    actor: Actor,
  ): Promise<ResumenExamen[]> {
    const intentos =
      actor.rol === Rol.ALUMNO
        ? await this.intentos.listarDeAlumno(consulta.grupo.id, actor.id)
        : [];
    return examenes.map((examen) => ({
      examen,
      ventana: this.ventanaDe(examen, consulta),
      ...(actor.rol === Rol.ALUMNO && {
        miIntento: intentos.find((i) => i.examenId === examen.id) ?? null,
      }),
    }));
  }

  // Los exámenes de la materia ya están cargados: no hace falta volver a buscarlo
  protected examenDelGrupo(examenId: string, consulta: Consulta): Examen {
    const examen = consulta.examenesDeMateria.find((e) => e.id === examenId);
    if (!examen) {
      throw new NoEncontradoError(
        'Examen no encontrado en la materia de este grupo',
      );
    }
    return examen;
  }
}

export class ListarExamenesDeGrupo extends ConsultaEnGrupo {
  async ejecutar(grupoId: string, actor: Actor): Promise<ResumenExamen[]> {
    const consulta = await this.preparar(grupoId, actor);
    return this.resumir(
      ordenarExamenes(consulta.examenesDeMateria),
      consulta,
      actor,
    );
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
    const consulta = await this.preparar(grupoId, actor);
    const deLaSemana = consulta.examenesDeMateria.filter(
      (e) => e.semana === semana,
    );
    const resumenes = await this.resumir(deLaSemana, consulta, actor);
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
    const consulta = await this.preparar(grupoId, actor);
    const examen = this.examenDelGrupo(examenId, consulta);
    const [resumen] = await this.resumir([examen], consulta, actor);
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
        preguntas: revisarRespuestas(
          examen.preguntas,
          miIntento.respuestas,
          puedeRevelarRespuestas(ventana),
        ),
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
  ventana: Ventana;
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
    const consulta = await this.preparar(grupoId, actor);
    const examen = this.examenDelGrupo(examenId, consulta);
    const ventana = this.ventanaDe(examen, consulta);
    validarQuePuedeResponder(examen, ventana, respuestas, this.zonaHoraria);

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
    // El examen sigue abierto para el resto del grupo: todavía sin la respuesta correcta
    return {
      intento,
      ventana,
      revision: revisarRespuestas(
        examen.preguntas,
        respuestas,
        puedeRevelarRespuestas(ventana),
      ),
    };
  }
}
