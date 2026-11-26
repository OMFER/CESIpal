import {
  ConflictoError,
  DatosInvalidosError,
  NoEncontradoError,
} from '../../../shared/domain/errores';
import { PublicadorEventos } from '../../../shared/domain/eventos';
import { diaDeLaSemana, LUNES } from '../../../shared/domain/fechas';
import { Reloj } from '../../../shared/domain/reloj';
import { Grupo } from '../domain/grupo';
import { EstadoPlan, nombreDePlan } from '../domain/plan';
import {
  CambiosGrupo,
  DatosGrupo,
  GrupoRepository,
} from '../domain/grupo.repository';
import { PlanRepository } from '../domain/plan.repository';
import { InscripcionRepository } from '../domain/inscripcion.repository';
import { buscarPlan } from './acceso';

// Los exámenes se abren de lunes a domingo (y de jueves a domingo): la semana 1 debe empezar en lunes
function validarQueEsLunes(fechaInicio: Date, zonaHoraria: string): void {
  if (diaDeLaSemana(fechaInicio, zonaHoraria) !== LUNES) {
    throw new DatosInvalidosError('La fecha de inicio debe ser un lunes');
  }
}

export class CrearGrupo {
  constructor(
    private readonly grupos: GrupoRepository,
    private readonly planes: PlanRepository,
    private readonly zonaHoraria = 'UTC',
  ) {}

  async ejecutar(datos: DatosGrupo): Promise<Grupo> {
    const plan = await buscarPlan(this.planes, datos.planId);
    if (plan.estado !== EstadoPlan.PUBLICADO) {
      throw new ConflictoError(
        `${nombreDePlan(plan)} es un borrador: publícalo antes de abrir un grupo con él`,
      );
    }
    validarQueEsLunes(datos.fechaInicio, this.zonaHoraria);
    return this.grupos.crear({ ...datos, nombre: datos.nombre.trim() });
  }
}

// La fecha de inicio solo se mueve antes de que el grupo empiece: después cambiaría las ventanas de exámenes ya presentados
export class ActualizarGrupo {
  constructor(
    private readonly grupos: GrupoRepository,
    private readonly reloj: Reloj,
    private readonly zonaHoraria = 'UTC',
  ) {}

  async ejecutar(id: string, cambios: CambiosGrupo): Promise<Grupo> {
    const grupo = await this.grupos.buscarPorId(id);
    if (!grupo) {
      throw new NoEncontradoError('Grupo no encontrado');
    }
    const { fechaInicio } = cambios;
    if (
      fechaInicio !== undefined &&
      fechaInicio.getTime() !== grupo.fechaInicio.getTime()
    ) {
      if (this.reloj.ahora() >= grupo.fechaInicio) {
        throw new ConflictoError(
          'El grupo ya empezó: su fecha de inicio ya no se puede cambiar',
        );
      }
      validarQueEsLunes(fechaInicio, this.zonaHoraria);
    }
    return (
      (await this.grupos.actualizar(id, {
        ...cambios,
        ...(cambios.nombre !== undefined && { nombre: cambios.nombre.trim() }),
      })) ?? grupo
    );
  }
}

// Los datos de los alumnos viven en el grupo: al borrarlo se van sus inscripciones y calificaciones
export class EliminarGrupo {
  constructor(
    private readonly grupos: GrupoRepository,
    private readonly inscripciones: InscripcionRepository,
    private readonly eventos: PublicadorEventos,
  ) {}

  async ejecutar(id: string): Promise<void> {
    if (!(await this.grupos.buscarPorId(id))) {
      throw new NoEncontradoError('Grupo no encontrado');
    }
    await this.inscripciones.vaciarGrupo(id);
    await this.grupos.eliminar(id);
    // Al final: si algo falla antes, las calificaciones del grupo siguen intactas
    await this.eventos.publicar({ tipo: 'GrupoEliminado', grupoId: id });
  }
}
