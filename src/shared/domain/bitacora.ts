// Registro de quién cambió qué en un plan de estudios: permite revisar y deshacer a mano una corrección
export type EntidadRegistrada = 'plan' | 'materia' | 'clase' | 'examen';

export type AccionRegistrada =
  | 'crear'
  | 'actualizar'
  | 'eliminar'
  | 'importar'
  | 'publicar'
  | 'nuevaVersion';

export interface Cambio {
  id: string;
  planId: string;
  entidad: EntidadRegistrada;
  entidadId: string;
  accion: AccionRegistrada;
  autorId: string;
  fecha: Date;
  // Cómo estaba y cómo quedó (solo los datos que aplican a la acción)
  antes?: unknown;
  despues?: unknown;
}

export type NuevoCambio = Omit<Cambio, 'id' | 'fecha'>;

export interface Bitacora {
  registrar(cambio: NuevoCambio): Promise<void>;
  // Del más reciente al más antiguo
  listarDePlan(planId: string): Promise<Cambio[]>;
  eliminarDePlan(planId: string): Promise<void>;
}

export const BITACORA = Symbol('Bitacora');
