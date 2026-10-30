import { Rol } from '../../../shared/domain/actor';
import {
  DatosInvalidosError,
  NoEncontradoError,
} from '../../../shared/domain/errores';
import { PublicadorEventos } from '../../../shared/domain/eventos';
import { UsuarioRepository } from '../../usuarios/domain/usuario.repository';
import { Grupo } from '../domain/grupo';
import {
  CambiosGrupo,
  DatosGrupo,
  GrupoRepository,
} from '../domain/grupo.repository';
import { MateriaRepository } from '../domain/materia.repository';
import { InscripcionRepository } from '../domain/inscripcion.repository';

async function validarMaestro(
  usuarios: UsuarioRepository,
  maestroId: string,
): Promise<void> {
  const maestro = await usuarios.buscarPorId(maestroId);
  if (!maestro || maestro.rol !== Rol.MAESTRO) {
    throw new DatosInvalidosError('maestroId no corresponde a un maestro');
  }
}

export class CrearGrupo {
  constructor(
    private readonly grupos: GrupoRepository,
    private readonly materias: MateriaRepository,
    private readonly usuarios: UsuarioRepository,
  ) {}

  async ejecutar(datos: DatosGrupo): Promise<Grupo> {
    if (!(await this.materias.buscarPorId(datos.materiaId))) {
      throw new DatosInvalidosError('materiaId no corresponde a una materia');
    }
    await validarMaestro(this.usuarios, datos.maestroId);
    return this.grupos.crear({
      ...datos,
      nombre: datos.nombre.trim(),
      periodo: datos.periodo.trim(),
    });
  }
}

export class ActualizarGrupo {
  constructor(
    private readonly grupos: GrupoRepository,
    private readonly usuarios: UsuarioRepository,
  ) {}

  async ejecutar(id: string, cambios: CambiosGrupo): Promise<Grupo> {
    if (cambios.maestroId !== undefined) {
      await validarMaestro(this.usuarios, cambios.maestroId);
    }
    const grupo = await this.grupos.actualizar(id, cambios);
    if (!grupo) {
      throw new NoEncontradoError('Grupo no encontrado');
    }
    return grupo;
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
    await this.eventos.publicar({ tipo: 'GrupoEliminado', grupoId: id });
    await this.inscripciones.vaciarGrupo(id);
    await this.grupos.eliminar(id);
  }
}
