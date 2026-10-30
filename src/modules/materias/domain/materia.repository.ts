import { Materia } from './materia';

export type DatosMateria = Omit<Materia, 'id'>;

export interface MateriaRepository {
  crear(datos: DatosMateria): Promise<Materia>;
  actualizar(
    id: string,
    cambios: Partial<DatosMateria>,
  ): Promise<Materia | null>;
  eliminar(id: string): Promise<void>;
  buscarPorId(id: string): Promise<Materia | null>;
  buscarPorIds(ids: string[]): Promise<Materia[]>;
  listar(): Promise<Materia[]>;
}

export const MATERIA_REPOSITORY = Symbol('MateriaRepository');
