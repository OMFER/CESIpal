import { Grupo } from './grupo';

export type DatosGrupo = Omit<Grupo, 'id'>;
export type CambiosGrupo = Partial<Omit<DatosGrupo, 'materiaId'>>;

export interface GrupoRepository {
  crear(datos: DatosGrupo): Promise<Grupo>;
  actualizar(id: string, cambios: CambiosGrupo): Promise<Grupo | null>;
  eliminar(id: string): Promise<void>;
  buscarPorId(id: string): Promise<Grupo | null>;
  buscarPorIds(ids: string[]): Promise<Grupo[]>;
  listar(): Promise<Grupo[]>;
  listarPorMaestro(maestroId: string): Promise<Grupo[]>;
  existeDeMateria(materiaId: string): Promise<boolean>;
  maestroImparteMateria(maestroId: string, materiaId: string): Promise<boolean>;
}

export const GRUPO_REPOSITORY = Symbol('GrupoRepository');
