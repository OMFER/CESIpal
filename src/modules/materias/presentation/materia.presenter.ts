import { presentarUsuarioResumen } from '../../usuarios/presentation/usuario.presenter';
import { Materia } from '../domain/materia';
import { GrupoDetallado } from '../application/consultar-grupos';

export function presentarMateria(materia: Materia) {
  return {
    _id: materia.id,
    nombre: materia.nombre,
    descripcion: materia.descripcion,
    totalSemanas: materia.totalSemanas,
  };
}

export function presentarGrupo(detalle: GrupoDetallado) {
  const { grupo, materia, maestro } = detalle;
  return {
    _id: grupo.id,
    nombre: grupo.nombre,
    periodo: grupo.periodo,
    aula: grupo.aula,
    fechaInicio: grupo.fechaInicio,
    materia: materia ? presentarMateria(materia) : { _id: grupo.materiaId },
    maestro: maestro
      ? presentarUsuarioResumen(maestro)
      : { _id: grupo.maestroId },
    semanaActual: detalle.semanaActual,
    semanas: detalle.semanas,
  };
}
