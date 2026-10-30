import { Actor } from '../../../shared/domain/actor';
import {
  ConflictoError,
  NoEncontradoError,
} from '../../../shared/domain/errores';
import { Materia, validarSemanaDeMateria } from '../../materias/domain/materia';
import { AccesoMaterias } from '../../materias/application/acceso-materias';
import {
  Examen,
  PUNTAJE_MAXIMO_POR_DEFECTO,
  TipoExamen,
  validarPreguntas,
} from '../domain/examen';
import {
  CambiosExamen,
  DatosExamen,
  ExamenRepository,
  IntentoRepository,
} from '../domain/examen.repository';

export type NuevoExamen = Omit<DatosExamen, 'tipo' | 'puntajeMaximo'> &
  Partial<Pick<DatosExamen, 'tipo' | 'puntajeMaximo'>>;

async function validarSemanaLibre(
  examenes: ExamenRepository,
  materia: Materia,
  semana: number,
  excluirId?: string,
): Promise<void> {
  validarSemanaDeMateria(materia, semana);
  const existente = await examenes.buscarPorSemana(materia.id, semana);
  if (existente && existente.id !== excluirId) {
    throw new ConflictoError(
      `La semana ${semana} ya tiene examen; edítalo en lugar de crear otro`,
    );
  }
}

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
  ) {}

  async ejecutar(datos: NuevoExamen, actor: Actor): Promise<Examen> {
    const materia = await this.acceso.paraEditar(datos.materiaId, actor);
    if (datos.semana !== undefined) {
      await validarSemanaLibre(this.examenes, materia, datos.semana);
    }
    validarPreguntas(datos.preguntas);
    return this.examenes.crear({
      ...datos,
      tipo: datos.tipo ?? TipoExamen.SEMANAL,
      puntajeMaximo: datos.puntajeMaximo ?? PUNTAJE_MAXIMO_POR_DEFECTO,
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
    const materia = await this.acceso.paraEditar(examen.materiaId, actor);

    if (cambios.preguntas) {
      validarPreguntas(cambios.preguntas);
      // Cambiar preguntas después de que alguien respondió dejaría calificaciones inconsistentes
      if (await this.intentos.existeParaExamen(id)) {
        throw new ConflictoError(
          'No se pueden cambiar las preguntas: ya hay alumnos que respondieron',
        );
      }
    }
    if (cambios.semana !== undefined && cambios.semana !== examen.semana) {
      await validarSemanaLibre(this.examenes, materia, cambios.semana, id);
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
    await this.intentos.eliminarPorExamen(id);
    await this.examenes.eliminar(id);
  }
}
