import { Actor } from '../../../shared/domain/actor';
import { Bitacora } from '../../../shared/domain/bitacora';
import {
  ConflictoError,
  NoEncontradoError,
} from '../../../shared/domain/errores';
import { validarEstructuraEditable } from '../../planes/domain/plan';
import { AccesoMaterias } from '../../planes/application/acceso';
import {
  esCorreccionDeTexto,
  Examen,
  ordenarExamenes,
  validarDiasExtra,
  validarPreguntas,
  validarSemanaYNumero,
} from '../domain/examen';
import { HojaDeExamenes, interpretarHoja } from '../domain/importacion';
import {
  CambiosExamen,
  DatosExamen,
  ExamenRepository,
  IntentoRepository,
} from '../domain/examen.repository';

export type NuevoExamen = Omit<DatosExamen, 'diasExtra'> &
  Partial<Pick<DatosExamen, 'diasExtra'>>;

export async function buscarExamen(
  examenes: ExamenRepository,
  id: string,
): Promise<Examen> {
  const examen = await examenes.buscarPorId(id);
  if (!examen) {
    throw new NoEncontradoError('Examen no encontrado');
  }
  return examen;
}

export class CrearExamen {
  constructor(
    private readonly acceso: AccesoMaterias,
    private readonly examenes: ExamenRepository,
    private readonly bitacora: Bitacora,
  ) {}

  async ejecutar(datos: NuevoExamen, actor: Actor): Promise<Examen> {
    const { plan } = await this.acceso.paraEditar(datos.materiaId, actor);
    validarEstructuraEditable(plan);
    const { semana, numero } = datos;
    validarSemanaYNumero(semana, numero);
    const diasExtra = datos.diasExtra ?? 0;
    validarDiasExtra(diasExtra);
    validarPreguntas(datos.preguntas);

    if (await this.examenes.buscarEnMateria(datos.materiaId, semana, numero)) {
      throw new ConflictoError(
        `La semana ${semana} ya tiene examen ${numero}; edítalo en lugar de crear otro`,
      );
    }
    const examen = await this.examenes.crear({ ...datos, diasExtra });
    await this.bitacora.registrar({
      planId: plan.id,
      entidad: 'examen',
      entidadId: examen.id,
      accion: 'crear',
      autorId: actor.id,
      despues: examen,
    });
    return examen;
  }
}

/**
 * Título, descripción y días extra se corrigen siempre. Las preguntas cambian libremente
 * mientras nadie haya respondido; después, solo se corrige su redacción.
 */
export class ActualizarExamen {
  constructor(
    private readonly acceso: AccesoMaterias,
    private readonly examenes: ExamenRepository,
    private readonly intentos: IntentoRepository,
    private readonly bitacora: Bitacora,
  ) {}

  async ejecutar(
    id: string,
    cambios: CambiosExamen,
    actor: Actor,
  ): Promise<Examen> {
    const antes = await buscarExamen(this.examenes, id);
    const { plan } = await this.acceso.paraEditar(antes.materiaId, actor);
    if (cambios.diasExtra !== undefined) validarDiasExtra(cambios.diasExtra);
    if (cambios.preguntas) {
      validarPreguntas(cambios.preguntas);
      const soloTexto = esCorreccionDeTexto(antes.preguntas, cambios.preguntas);
      if (!soloTexto && (await this.intentos.existeParaExamen(id))) {
        throw new ConflictoError(
          'Ya hay alumnos que respondieron este examen: solo puedes corregir la redacción de preguntas y opciones. Para cambiar respuestas o agregar o quitar preguntas, crea una nueva versión del plan',
        );
      }
    }
    const examen = (await this.examenes.actualizar(id, cambios)) ?? antes;
    await this.bitacora.registrar({
      planId: plan.id,
      entidad: 'examen',
      entidadId: id,
      accion: 'actualizar',
      autorId: actor.id,
      antes,
      despues: examen,
    });
    return examen;
  }
}

export class EliminarExamen {
  constructor(
    private readonly acceso: AccesoMaterias,
    private readonly examenes: ExamenRepository,
    private readonly bitacora: Bitacora,
  ) {}

  async ejecutar(id: string, actor: Actor): Promise<void> {
    const examen = await buscarExamen(this.examenes, id);
    const { plan } = await this.acceso.paraEditar(examen.materiaId, actor);
    // Solo en borrador: ningún grupo lo ha presentado
    validarEstructuraEditable(plan);
    await this.examenes.eliminar(id);
    await this.bitacora.registrar({
      planId: plan.id,
      entidad: 'examen',
      entidadId: id,
      accion: 'eliminar',
      autorId: actor.id,
      antes: examen,
    });
  }
}

/**
 * Carga los exámenes de una materia desde la plantilla de Google Sheets.
 * Primero valida toda la hoja; si está bien, crea o reemplaza cada examen que trae (solo en borrador).
 */
export class ImportarExamenes {
  constructor(
    private readonly acceso: AccesoMaterias,
    private readonly examenes: ExamenRepository,
    private readonly bitacora: Bitacora,
  ) {}

  async ejecutar(
    materiaId: string,
    hoja: HojaDeExamenes,
    actor: Actor,
  ): Promise<Examen[]> {
    const { plan } = await this.acceso.paraEditar(materiaId, actor);
    validarEstructuraEditable(plan);
    const importados = interpretarHoja(hoja);

    const guardados: Examen[] = [];
    for (const { semana, numero, titulo, preguntas } of importados) {
      const existente = await this.examenes.buscarEnMateria(
        materiaId,
        semana,
        numero,
      );
      guardados.push(
        existente
          ? ((await this.examenes.actualizar(existente.id, {
              titulo,
              preguntas,
            })) ?? existente)
          : await this.examenes.crear({
              materiaId,
              semana,
              numero,
              titulo,
              diasExtra: 0,
              preguntas,
            }),
      );
    }
    await this.bitacora.registrar({
      planId: plan.id,
      entidad: 'materia',
      entidadId: materiaId,
      accion: 'importar',
      autorId: actor.id,
      despues: guardados.map(({ id, semana, numero, preguntas }) => ({
        id,
        semana,
        numero,
        preguntas: preguntas.length,
      })),
    });
    return guardados;
  }
}

// Para quien edita la materia: los exámenes completos, con sus respuestas
export class ListarExamenesDeMateria {
  constructor(
    private readonly acceso: AccesoMaterias,
    private readonly examenes: ExamenRepository,
  ) {}

  async ejecutar(materiaId: string, actor: Actor): Promise<Examen[]> {
    await this.acceso.paraEditar(materiaId, actor);
    return ordenarExamenes(await this.examenes.listarPorMateria(materiaId));
  }
}

export interface ExamenParaEditar {
  examen: Examen;
  // En cualquier grupo: si es true, solo se corrige la redacción de las preguntas
  tieneRespuestas: boolean;
}

export class ObtenerExamenDeMateria {
  constructor(
    private readonly acceso: AccesoMaterias,
    private readonly examenes: ExamenRepository,
    private readonly intentos: IntentoRepository,
  ) {}

  async ejecutar(id: string, actor: Actor): Promise<ExamenParaEditar> {
    const examen = await buscarExamen(this.examenes, id);
    await this.acceso.paraEditar(examen.materiaId, actor);
    return {
      examen,
      tieneRespuestas: await this.intentos.existeParaExamen(id),
    };
  }
}
