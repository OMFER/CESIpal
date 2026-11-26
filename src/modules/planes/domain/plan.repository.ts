import { Plan } from './plan';

export type DatosPlan = Omit<Plan, 'id'>;
// El nombre y la versión identifican al plan: no cambian
export type CambiosPlan = Partial<
  Pick<Plan, 'descripcion' | 'estado' | 'publicadoEn'>
>;

export interface PlanRepository {
  crear(datos: DatosPlan): Promise<Plan>;
  actualizar(id: string, cambios: CambiosPlan): Promise<Plan | null>;
  eliminar(id: string): Promise<void>;
  buscarPorId(id: string): Promise<Plan | null>;
  buscarPorIds(ids: string[]): Promise<Plan[]>;
  listar(): Promise<Plan[]>;
  // Versión más alta de los planes con ese nombre (0 si no hay ninguno)
  ultimaVersion(nombre: string): Promise<number>;
}

export const PLAN_REPOSITORY = Symbol('PlanRepository');
