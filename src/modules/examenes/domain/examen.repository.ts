import { Examen } from './examen';
import { Intento } from './intento';

export type DatosExamen = Omit<Examen, 'id'>;
// La materia, la semana y el número identifican al examen: no cambian
export type CambiosExamen = Partial<
  Omit<DatosExamen, 'materiaId' | 'semana' | 'numero'>
>;

export interface ExamenRepository {
  crear(datos: DatosExamen): Promise<Examen>;
  actualizar(id: string, cambios: CambiosExamen): Promise<Examen | null>;
  eliminar(id: string): Promise<void>;
  buscarPorId(id: string): Promise<Examen | null>;
  buscarEnMateria(
    materiaId: string,
    semana: number,
    numero: number,
  ): Promise<Examen | null>;
  listarPorMateria(materiaId: string): Promise<Examen[]>;
  listarPorMaterias(materiaIds: string[]): Promise<Examen[]>;
  eliminarDeMateria(materiaId: string): Promise<void>;
}

export type DatosIntento = Omit<Intento, 'id' | 'fecha'>;

export interface IntentoRepository {
  crear(datos: DatosIntento): Promise<Intento>;
  listarDeAlumno(grupoId: string, alumnoId: string): Promise<Intento[]>;
  listarDeGrupo(grupoId: string, examenId?: string): Promise<Intento[]>;
  existeParaExamen(examenId: string): Promise<boolean>;
  eliminarDeGrupo(grupoId: string): Promise<void>;
}

export const EXAMEN_REPOSITORY = Symbol('ExamenRepository');
export const INTENTO_REPOSITORY = Symbol('IntentoRepository');
