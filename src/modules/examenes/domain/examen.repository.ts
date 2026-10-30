import { Examen } from './examen';
import { Intento } from './intento';

export type DatosExamen = Omit<Examen, 'id'>;
export type CambiosExamen = Partial<Omit<DatosExamen, 'materiaId'>>;

export interface ExamenRepository {
  crear(datos: DatosExamen): Promise<Examen>;
  actualizar(id: string, cambios: CambiosExamen): Promise<Examen | null>;
  eliminar(id: string): Promise<void>;
  buscarPorId(id: string): Promise<Examen | null>;
  buscarPorSemana(materiaId: string, semana: number): Promise<Examen | null>;
  listarPorMateria(materiaId: string): Promise<Examen[]>;
}

export type DatosIntento = Omit<Intento, 'id' | 'fecha'>;

export interface IntentoRepository {
  crear(datos: DatosIntento): Promise<Intento>;
  buscar(examenId: string, alumnoId: string): Promise<Intento | null>;
  listarDeAlumno(alumnoId: string, examenIds: string[]): Promise<Intento[]>;
  listarPorExamen(examenId: string): Promise<Intento[]>;
  existeParaExamen(examenId: string): Promise<boolean>;
  eliminarPorExamen(examenId: string): Promise<void>;
}

export const EXAMEN_REPOSITORY = Symbol('ExamenRepository');
export const INTENTO_REPOSITORY = Symbol('IntentoRepository');
