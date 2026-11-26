import { Cambio } from '../../../shared/domain/bitacora';
import { presentarUsuarioResumen } from '../../usuarios/presentation/usuario.presenter';
import { Plan } from '../domain/plan';
import { Materia } from '../domain/materia';
import { GrupoDetallado } from '../application/consultar-grupos';
import {
  MateriaConMaestro,
  PlanDetallado,
} from '../application/gestionar-planes';
import { ContextoMateria } from '../application/acceso';

export function presentarPlan(plan: Plan) {
  return {
    _id: plan.id,
    nombre: plan.nombre,
    descripcion: plan.descripcion,
    version: plan.version,
    estado: plan.estado,
    publicadoEn: plan.publicadoEn,
  };
}

export function presentarMateria(materia: Materia) {
  return {
    _id: materia.id,
    plan: materia.planId,
    nombre: materia.nombre,
    descripcion: materia.descripcion,
    bloque: materia.bloque,
    maestro: materia.maestroId,
  };
}

const presentarMateriaConMaestro = ({
  materia,
  maestro,
}: MateriaConMaestro) => ({
  ...presentarMateria(materia),
  maestro: maestro
    ? presentarUsuarioResumen(maestro)
    : materia.maestroId && { _id: materia.maestroId },
});

export const presentarPlanDetallado = ({ plan, materias }: PlanDetallado) => ({
  ...presentarPlan(plan),
  materias: materias.map(presentarMateriaConMaestro),
});

// Una materia junto con la versión del plan a la que pertenece
export const presentarMateriaEnPlan = ({ materia, plan }: ContextoMateria) => ({
  ...presentarMateria(materia),
  plan: presentarPlan(plan),
});

export function presentarGrupo(detalle: GrupoDetallado) {
  const { grupo, plan } = detalle;
  return {
    _id: grupo.id,
    nombre: grupo.nombre,
    fechaInicio: grupo.fechaInicio,
    plan: plan ? presentarPlan(plan) : { _id: grupo.planId },
    materias: detalle.materias.map(presentarMateriaConMaestro),
    semanaActual: detalle.semanaActual,
    semanas: detalle.semanas,
  };
}

export function presentarCambio(cambio: Cambio) {
  return {
    _id: cambio.id,
    entidad: cambio.entidad,
    entidadId: cambio.entidadId,
    accion: cambio.accion,
    autor: cambio.autorId,
    fecha: cambio.fecha,
    antes: cambio.antes,
    despues: cambio.despues,
  };
}
