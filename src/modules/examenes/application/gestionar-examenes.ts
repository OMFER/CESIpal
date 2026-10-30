import { Actor } from '../../../shared/domain/actor';
import {
  ConflictoError,
  DatosInvalidosError,
  NoEncontradoError,
} from '../../../shared/domain/errores';
import { validarSemanaDeMateria } from '../../materias/domain/materia';
import { AccesoMaterias } from '../../materias/application/acceso';
import {
  Examen,
  PUNTAJE_MAXIMO_POR_DEFECTO,
  TipoExamen,
  validarDiasExtra,
  validarPreguntas,
  validarTipoYSemana,
} from '../domain/examen';
import {
  CambiosExamen,
  DatosExamen,
  ExamenRepository,
  IntentoRepository,
} from '../domain/examen.repository';

export type NuevoExamen = Omit<DatosExamen, 'puntajeMaximo' | 'diasExtra'> &
  Partial<Pick<DatosExamen, 'puntajeMaximo' | 'diasExtra'>>;

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

const yaExiste = ({ tipo, semana }: Pick<Examen, 'tipo' | 'semana'>) =>
  tipo === TipoExamen.FINAL
    ? 'La materia ya tiene examen final'
    : `La semana ${semana} ya tiene examen ${tipo === TipoExamen.SEMANAL ? 'semanal' : 'de reposición'}`;

export class CrearExamen {
  constructor(
    private readonly acceso: AccesoMaterias,
    private readonly examenes: ExamenRepository,
  ) {}

  async ejecutar(datos: NuevoExamen, actor: Actor): Promise<Examen> {
    const materia = await this.acceso.paraEditar(datos.materiaId, actor);
    const { tipo, semana } = datos;
    validarTipoYSemana(tipo, semana);
    if (semana !== undefined) validarSemanaDeMateria(materia, semana);
    const diasExtra = datos.diasExtra ?? 0;
    validarDiasExtra(diasExtra);
    validarPreguntas(datos.preguntas);

    if (await this.examenes.buscarEnMateria(materia.id, tipo, semana)) {
      throw new ConflictoError(
        `${yaExiste(datos)}; edítalo en lugar de crear otro`,
      );
    }
    const sinSemanal =
      tipo === TipoExamen.REPOSICION &&
      !(await this.examenes.buscarEnMateria(
        materia.id,
        TipoExamen.SEMANAL,
        semana,
      ));
    if (sinSemanal) {
      throw new DatosInvalidosError(
        `La semana ${semana} no tiene examen semanal; créalo antes de su reposición`,
      );
    }
    return this.examenes.crear({
      ...datos,
      puntajeMaximo: datos.puntajeMaximo ?? PUNTAJE_MAXIMO_POR_DEFECTO,
      diasExtra,
    });
  }
}

export class ActualizarExamen {
  constructor(
    private readonly acceso: AccesoMaterias,
    private readonly examenes: ExamenRepository,
    private readonly intentos: IntentoRepository,
  ) {}

  async ejecutar(
    id: string,
    cambios: CambiosExamen,
    actor: Actor,
  ): Promise<Examen> {
    const examen = await buscarExamen(this.examenes, id);
    await this.acceso.paraEditar(examen.materiaId, actor);
    if (cambios.diasExtra !== undefined) validarDiasExtra(cambios.diasExtra);
    if (cambios.preguntas) {
      validarPreguntas(cambios.preguntas);
      // Cambiar preguntas después de que alguien respondió dejaría calificaciones inconsistentes
      if (await this.intentos.existeParaExamen(id)) {
        throw new ConflictoError(
          'No se pueden cambiar las preguntas: ya hay alumnos que respondieron',
        );
      }
    }
    return (await this.examenes.actualizar(id, cambios)) ?? examen;
  }
}

export class EliminarExamen {
  constructor(
    private readonly acceso: AccesoMaterias,
    private readonly examenes: ExamenRepository,
    private readonly intentos: IntentoRepository,
  ) {}

  async ejecutar(id: string, actor: Actor): Promise<void> {
    const examen = await buscarExamen(this.examenes, id);
    await this.acceso.paraEditar(examen.materiaId, actor);
    const tieneReposicion =
      examen.tipo === TipoExamen.SEMANAL &&
      (await this.examenes.buscarEnMateria(
        examen.materiaId,
        TipoExamen.REPOSICION,
        examen.semana,
      ));
    if (tieneReposicion) {
      throw new ConflictoError(
        `La semana ${examen.semana} tiene examen de reposición; elimínalo primero`,
      );
    }
    await this.intentos.eliminarPorExamen(id);
    await this.examenes.eliminar(id);
  }
}

// Para los editores de la materia: los exámenes completos, con sus respuestas
export class ListarExamenesDeMateria {
  constructor(
    private readonly acceso: AccesoMaterias,
    private readonly examenes: ExamenRepository,
  ) {}

  async ejecutar(materiaId: string, actor: Actor): Promise<Examen[]> {
    await this.acceso.paraEditar(materiaId, actor);
    return this.examenes.listarPorMateria(materiaId);
  }
}

export class ObtenerExamenDeMateria {
  constructor(
    private readonly acceso: AccesoMaterias,
    private readonly examenes: ExamenRepository,
  ) {}

  async ejecutar(id: string, actor: Actor): Promise<Examen> {
    const examen = await buscarExamen(this.examenes, id);
    await this.acceso.paraEditar(examen.materiaId, actor);
    return examen;
  }
}
