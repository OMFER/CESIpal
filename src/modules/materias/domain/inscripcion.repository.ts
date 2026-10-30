import { Usuario } from '../../usuarios/domain/usuario';

// Qué alumnos cursan qué materias
export interface InscripcionRepository {
  inscribir(alumnoIds: string[], materiaId: string): Promise<void>;
  darDeBaja(alumnoId: string, materiaId: string): Promise<void>;
  estaInscrito(alumnoId: string, materiaId: string): Promise<boolean>;
  materiasDeAlumno(alumnoId: string): Promise<string[]>;
  alumnosDeMateria(materiaId: string): Promise<Usuario[]>;
}

export const INSCRIPCION_REPOSITORY = Symbol('InscripcionRepository');
