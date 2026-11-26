import { Actor } from '../../../shared/domain/actor';
import { Bitacora } from '../../../shared/domain/bitacora';
import {
  ConflictoError,
  DatosInvalidosError,
} from '../../../shared/domain/errores';
import { Reloj } from '../../../shared/domain/reloj';
import { EstadoPlan, nombreDePlan, Plan } from '../../planes/domain/plan';
import { Materia } from '../../planes/domain/materia';
import { PlanRepository } from '../../planes/domain/plan.repository';
import { MateriaRepository } from '../../planes/domain/materia.repository';
import { buscarPlan } from '../../planes/application/acceso';
import { ClaseRepository } from '../../clases/domain/clase.repository';
import { ExamenRepository } from '../../examenes/domain/examen.repository';
import { pendientesParaPublicar } from '../domain/pendientes';

// Lee el plan completo: sus materias con el contenido y los exámenes que ya tienen
class RevisionDePlan {
  constructor(
    private readonly materias: MateriaRepository,
    private readonly clases: ClaseRepository,
    private readonly examenes: ExamenRepository,
  ) {}

  async pendientes(planId: string): Promise<string[]> {
    const materias = await this.materias.listarPorPlan(planId);
    const ids = materias.map((m) => m.id);
    const [clases, examenes] = await Promise.all([
      this.clases.listarPorMaterias(ids),
      this.examenes.listarPorMaterias(ids),
    ]);
    return pendientesParaPublicar(
      materias.map((materia) => ({
        materia,
        semanasConContenido: clases
          .filter((c) => c.materiaId === materia.id)
          .map((c) => c.semana),
        examenes: examenes.filter((e) => e.materiaId === materia.id),
      })),
    );
  }
}

export class RevisarPlan {
  private readonly revision: RevisionDePlan;

  constructor(
    private readonly planes: PlanRepository,
    materias: MateriaRepository,
    clases: ClaseRepository,
    examenes: ExamenRepository,
  ) {
    this.revision = new RevisionDePlan(materias, clases, examenes);
  }

  async ejecutar(planId: string): Promise<string[]> {
    await buscarPlan(this.planes, planId);
    return this.revision.pendientes(planId);
  }
}

/**
 * Congela la estructura del plan para que los grupos puedan usarlo. Es una sola escritura
 * (el estado del plan), así que no puede quedar publicado a medias.
 */
export class PublicarPlan {
  private readonly revision: RevisionDePlan;

  constructor(
    private readonly planes: PlanRepository,
    materias: MateriaRepository,
    clases: ClaseRepository,
    examenes: ExamenRepository,
    private readonly bitacora: Bitacora,
    private readonly reloj: Reloj,
  ) {
    this.revision = new RevisionDePlan(materias, clases, examenes);
  }

  async ejecutar(planId: string, actor: Actor): Promise<Plan> {
    const plan = await buscarPlan(this.planes, planId);
    if (plan.estado === EstadoPlan.PUBLICADO) {
      throw new ConflictoError(`${nombreDePlan(plan)} ya está publicado`);
    }
    const pendientes = await this.revision.pendientes(planId);
    if (pendientes.length) {
      throw new DatosInvalidosError(
        `${nombreDePlan(plan)} aún no se puede publicar: tiene ${pendientes.length} pendientes`,
        pendientes,
      );
    }
    const publicado =
      (await this.planes.actualizar(planId, {
        estado: EstadoPlan.PUBLICADO,
        publicadoEn: this.reloj.ahora(),
      })) ?? plan;
    await this.bitacora.registrar({
      planId,
      entidad: 'plan',
      entidadId: planId,
      accion: 'publicar',
      autorId: actor.id,
    });
    return publicado;
  }
}

/**
 * Copia una versión (publicada o no) a un borrador nuevo con el siguiente número de versión:
 * materias, contenido y exámenes. Los grupos existentes siguen con su versión; los nuevos
 * podrán usar esta cuando se publique. Si la copia falla a medias, queda un borrador que se puede borrar.
 */
export class CrearNuevaVersion {
  constructor(
    private readonly planes: PlanRepository,
    private readonly materias: MateriaRepository,
    private readonly clases: ClaseRepository,
    private readonly examenes: ExamenRepository,
    private readonly bitacora: Bitacora,
  ) {}

  async ejecutar(planId: string, actor: Actor): Promise<Plan> {
    const origen = await buscarPlan(this.planes, planId);
    const nuevo = await this.planes.crear({
      nombre: origen.nombre,
      descripcion: origen.descripcion,
      version: (await this.planes.ultimaVersion(origen.nombre)) + 1,
      estado: EstadoPlan.BORRADOR,
    });

    for (const materia of await this.materias.listarPorPlan(planId)) {
      await this.copiarMateria(materia, nuevo.id);
    }

    await this.bitacora.registrar({
      planId: nuevo.id,
      entidad: 'plan',
      entidadId: nuevo.id,
      accion: 'nuevaVersion',
      autorId: actor.id,
      antes: { planId: origen.id, version: origen.version },
    });
    return nuevo;
  }

  private async copiarMateria(materia: Materia, planId: string) {
    const copia = await this.materias.crear({
      planId,
      nombre: materia.nombre,
      descripcion: materia.descripcion,
      bloque: materia.bloque,
      maestroId: materia.maestroId,
    });
    for (const clase of await this.clases.listarPorMateria(materia.id)) {
      await this.clases.crear({
        materiaId: copia.id,
        semana: clase.semana,
        tema: clase.tema,
        introduccion: clase.introduccion,
        recursos: clase.recursos,
        links: clase.links,
      });
    }
    for (const examen of await this.examenes.listarPorMateria(materia.id)) {
      await this.examenes.crear({
        materiaId: copia.id,
        semana: examen.semana,
        numero: examen.numero,
        titulo: examen.titulo,
        descripcion: examen.descripcion,
        diasExtra: examen.diasExtra,
        // Las preguntas reciben ids nuevos al guardarse
        preguntas: examen.preguntas.map(
          ({ enunciado, opciones, respuestaCorrecta }) => ({
            enunciado,
            opciones,
            respuestaCorrecta,
          }),
        ),
      });
    }
  }
}
