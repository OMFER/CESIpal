import { presentarUsuarioResumen } from '../../usuarios/presentation/usuario.presenter';
import {
  MateriaConCalendario,
  MateriaConMaestro,
} from '../application/vistas-materia';

export function presentarMateria({ materia, maestro }: MateriaConMaestro) {
  return {
    _id: materia.id,
    nombre: materia.nombre,
    descripcion: materia.descripcion,
    grupo: materia.grupo,
    aula: materia.aula,
    maestro: maestro
      ? presentarUsuarioResumen(maestro)
      : { _id: materia.maestroId },
    fechaInicio: materia.fechaInicio,
    totalSemanas: materia.totalSemanas,
  };
}

export function presentarMateriaConCalendario(vista: MateriaConCalendario) {
  return {
    ...presentarMateria(vista),
    semanaActual: vista.semanaActual,
    semanas: vista.semanas,
  };
}
