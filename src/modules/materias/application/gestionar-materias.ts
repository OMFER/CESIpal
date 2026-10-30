import { Rol } from '../../../shared/domain/actor';
import {
  DatosInvalidosError,
  NoEncontradoError,
} from '../../../shared/domain/errores';
import { UsuarioRepository } from '../../usuarios/domain/usuario.repository';
import {
  Materia,
  SEMANAS_POR_DEFECTO,
  validarTotalSemanas,
} from '../domain/materia';
import { DatosMateria, MateriaRepository } from '../domain/materia.repository';
import { conMaestros, MateriaConMaestro } from './vistas-materia';

export type NuevaMateria = Omit<DatosMateria, 'totalSemanas'> & {
  totalSemanas?: number;
};

async function validarMaestro(
  usuarios: UsuarioRepository,
  maestroId: string,
): Promise<void> {
  const maestro = await usuarios.buscarPorId(maestroId);
  if (!maestro || maestro.rol !== Rol.MAESTRO) {
    throw new DatosInvalidosError('maestroId no corresponde a un maestro');
  }
}

export class CrearMateria {
  constructor(
    private readonly materias: MateriaRepository,
    private readonly usuarios: UsuarioRepository,
  ) {}

  async ejecutar(datos: NuevaMateria): Promise<Materia> {
    const totalSemanas = datos.totalSemanas ?? SEMANAS_POR_DEFECTO;
    validarTotalSemanas(totalSemanas);
    await validarMaestro(this.usuarios, datos.maestroId);
    return this.materias.crear({ ...datos, totalSemanas });
  }
}

export class ActualizarMateria {
  constructor(
    private readonly materias: MateriaRepository,
    private readonly usuarios: UsuarioRepository,
  ) {}

  async ejecutar(id: string, cambios: Partial<DatosMateria>): Promise<Materia> {
    if (cambios.totalSemanas !== undefined)
      validarTotalSemanas(cambios.totalSemanas);
    if (cambios.maestroId !== undefined)
      await validarMaestro(this.usuarios, cambios.maestroId);

    const materia = await this.materias.actualizar(id, cambios);
    if (!materia) {
      throw new NoEncontradoError('Materia no encontrada');
    }
    return materia;
  }
}

export class EliminarMateria {
  constructor(private readonly materias: MateriaRepository) {}

  async ejecutar(id: string): Promise<void> {
    if (!(await this.materias.eliminar(id))) {
      throw new NoEncontradoError('Materia no encontrada');
    }
  }
}

export class ListarMaterias {
  constructor(
    private readonly materias: MateriaRepository,
    private readonly usuarios: UsuarioRepository,
  ) {}

  async ejecutar(): Promise<MateriaConMaestro[]> {
    return conMaestros(await this.materias.listar(), this.usuarios);
  }
}
