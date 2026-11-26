import { Materia } from './materia';

export type DatosMateria = Omit<Materia, 'id'>;
// La materia no cambia de plan; maestroId en null le quita el maestro
export type CambiosMateria = Partial<
  Omit<DatosMateria, 'planId' | 'maestroId'>
> & { maestroId?: string | null };

export interface MateriaRepository {
  crear(datos: DatosMateria): Promise<Materia>;
  actualizar(id: string, cambios: CambiosMateria): Promise<Materia | null>;
  eliminar(id: string): Promise<void>;
  buscarPorId(id: string): Promise<Materia | null>;
  // Ordenadas por bloque y nombre
  listarPorPlan(planId: string): Promise<Materia[]>;
  listarPorMaestro(maestroId: string): Promise<Materia[]>;
}

export const MATERIA_REPOSITORY = Symbol('MateriaRepository');
