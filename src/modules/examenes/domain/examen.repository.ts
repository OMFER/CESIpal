import { Examen, TipoExamen } from './examen';
import { Intento } from './intento';

export type DatosExamen = Omit<Examen, 'id'>;
// El tipo y la semana identifican al examen dentro de la materia: no cambian
export type CambiosExamen = Partial<
  Omit<DatosExamen, 'materiaId' | 'tipo' | 'semana'>
>;

export interface ExamenRepository {
  crear(datos: DatosExamen): Promise<Examen>;
  actualizar(id: string, cambios: CambiosExamen): Promise<Examen | null>;
  eliminar(id: string): Promise<void>;
  buscarPorId(id: string): Promise<Examen | null>;
  buscarEnMateria(
    materiaId: string,
    tipo: TipoExamen,
    semana?: number,
  ): Promise<Examen | null>;
  listarPorMateria(materiaId: string): Promise<Examen[]>;
  eliminarDeMateria(materiaId: string): Promise<void>;
}

export type DatosIntento = Omit<Intento, 'id' | 'fecha'>;

export interface IntentoRepository {
  crear(datos: DatosIntento): Promise<Intento>;
  buscar(
    examenId: string,
    grupoId: string,
    alumnoId: string,
  ): Promise<Intento | null>;
  listarDeAlumno(grupoId: string, alumnoId: string): Promise<Intento[]>;
  listarDeGrupo(grupoId: string, examenId?: string): Promise<Intento[]>;
  existeParaExamen(examenId: string): Promise<boolean>;
  eliminarPorExamen(examenId: string): Promise<void>;
  eliminarDeGrupo(grupoId: string): Promise<void>;
}

export const EXAMEN_REPOSITORY = Symbol('ExamenRepository');
export const INTENTO_REPOSITORY = Symbol('IntentoRepository');
