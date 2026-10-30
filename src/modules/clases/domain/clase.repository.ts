import { Clase } from './clase';

export type DatosClase = Omit<Clase, 'id'>;
export type CambiosClase = Partial<Omit<DatosClase, 'materiaId' | 'semana'>>;

export interface ClaseRepository {
  crear(datos: DatosClase): Promise<Clase>;
  actualizar(id: string, cambios: CambiosClase): Promise<Clase | null>;
  eliminar(id: string): Promise<void>;
  buscarPorId(id: string): Promise<Clase | null>;
  buscarPorSemana(materiaId: string, semana: number): Promise<Clase | null>;
  listarPorMateria(materiaId: string): Promise<Clase[]>;
}

export const CLASE_REPOSITORY = Symbol('ClaseRepository');
