import { Grupo } from './grupo';

export type DatosGrupo = Omit<Grupo, 'id'>;
// El plan de un grupo no cambia
export type CambiosGrupo = Partial<Omit<DatosGrupo, 'planId'>>;

export interface GrupoRepository {
  crear(datos: DatosGrupo): Promise<Grupo>;
  actualizar(id: string, cambios: CambiosGrupo): Promise<Grupo | null>;
  eliminar(id: string): Promise<void>;
  buscarPorId(id: string): Promise<Grupo | null>;
  buscarPorIds(ids: string[]): Promise<Grupo[]>;
  listar(): Promise<Grupo[]>;
  listarPorPlanes(planIds: string[]): Promise<Grupo[]>;
  existeDePlan(planId: string): Promise<boolean>;
}

export const GRUPO_REPOSITORY = Symbol('GrupoRepository');
