import { Actor, Rol } from '../../../shared/domain/actor';
import {
  ConflictoError,
  NoEncontradoError,
  SinPermisoError,
} from '../../../shared/domain/errores';
import { Reloj } from '../../../shared/domain/reloj';
import { Materia } from '../../planes/domain/materia';
import { inicioDeSemana, semanaDelGrupo } from '../../planes/domain/calendario';
import { AccesoGrupos, ContextoGrupo } from '../../planes/application/acceso';
import { Examen, ordenarExamenes, puedeVerRespuestas } from '../domain/examen';
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
  materia: Materia;
  // Semana del grupo en la que se presenta
  semanaDelGrupo: number;
  ventana: Ventana;
  // Solo para alumnos: null si todavía no responde
  miIntento?: Intento | null;
}

// Qué preguntas recibe el actor: con respuestas (maestro, admin), sin ellas (alumno con examen abierto),
// ninguna (alumno fuera de la ventana) o la revisión de lo que contestó
export type PreguntasVisibles =
  | { modo: 'conRespuestas' }
  | { modo: 'sinRespuestas' }
  | { modo: 'ocultas' }
  | { modo: 'revision'; preguntas: PreguntaRevisada[] };

export interface ExamenEnGrupo extends ResumenExamen {
  preguntas: PreguntasVisibles;
}

// Lo que necesita cualquier consulta: el grupo, su plan y los exámenes de todas sus materias
interface Consulta extends ContextoGrupo {
  examenesDelPlan: Examen[];
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
    const examenesDelPlan = await this.examenes.listarPorMaterias(
      contexto.materias.map((m) => m.id),
    );
    return { ...contexto, examenesDelPlan };
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
    const ahora = this.reloj.ahora();
    return examenes.flatMap((examen) => {
      const materia = consulta.materias.find((m) => m.id === examen.materiaId);
      if (!materia) return [];
      const semana = semanaDelGrupo(materia.bloque, examen.semana);
      return [
        {
          examen,
          materia,
          semanaDelGrupo: semana,
          ventana: calcularVentana(
            examen,
            inicioDeSemana(consulta.grupo.fechaInicio, semana),
            ahora,
          ),
          ...(actor.rol === Rol.ALUMNO && {
            miIntento: intentos.find((i) => i.examenId === examen.id) ?? null,
          }),
        },
      ];
    });
  }

  // Los exámenes del plan ya están cargados: no hace falta volver a buscarlo
  protected examenDelGrupo(examenId: string, consulta: Consulta): Examen {
    const examen = consulta.examenesDelPlan.find((e) => e.id === examenId);
    if (!examen) {
      throw new NoEncontradoError(
        'Examen no encontrado en el plan de este grupo',
      );
    }
    return examen;
  }
}

// Todos los exámenes del grupo en orden de calendario
export class ListarExamenesDeGrupo extends ConsultaEnGrupo {
  async ejecutar(grupoId: string, actor: Actor): Promise<ResumenExamen[]> {
    const consulta = await this.preparar(grupoId, actor);
    const resumenes = await this.resumir(
      ordenarExamenes(consulta.examenesDelPlan),
      consulta,
      actor,
    );
    return resumenes.sort(
      (a, b) =>
        a.semanaDelGrupo - b.semanaDelGrupo ||
        a.materia.nombre.localeCompare(b.materia.nombre) ||
        a.examen.numero - b.examen.numero,
    );
  }
}

// Los dos exámenes de una semana de una materia
export class ObtenerExamenesDeSemana extends ConsultaEnGrupo {
  async ejecutar(
    grupoId: string,
    materiaId: string,
    semana: number,
    actor: Actor,
  ): Promise<ResumenExamen[]> {
    const consulta = await this.preparar(grupoId, actor);
    if (!consulta.materias.some((m) => m.id === materiaId)) {
      throw new NoEncontradoError('La materia no pertenece al plan del grupo');
    }
    const deLaSemana = consulta.examenesDelPlan.filter(
      (e) => e.materiaId === materiaId && e.semana === semana,
    );
    return this.resumir(ordenarExamenes(deLaSemana), consulta, actor);
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
    const [{ ventana, miIntento }] = await this.resumir(
      [examen],
      consulta,
      actor,
    );
    validarQuePuedeResponder(examen, ventana, respuestas, this.zonaHoraria);
    if (miIntento) {
      throw new ConflictoError('Ya respondiste este examen');
    }

    const intento = await this.intentos.crear({
      examenId,
      grupoId,
      alumnoId: actor.id,
      respuestas,
      ...calificarExamen(examen.preguntas, respuestas),
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
