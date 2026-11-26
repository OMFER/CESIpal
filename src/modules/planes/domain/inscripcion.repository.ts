import { Usuario } from '../../usuarios/domain/usuario';

// Qué alumnos están inscritos en qué grupos
export interface InscripcionRepository {
  inscribir(alumnoIds: string[], grupoId: string): Promise<void>;
  darDeBaja(alumnoId: string, grupoId: string): Promise<void>;
  // Saca a todos los alumnos del grupo
  vaciarGrupo(grupoId: string): Promise<void>;
  estaInscrito(alumnoId: string, grupoId: string): Promise<boolean>;
  gruposDeAlumno(alumnoId: string): Promise<string[]>;
  alumnosDeGrupo(grupoId: string): Promise<Usuario[]>;
}

export const INSCRIPCION_REPOSITORY = Symbol('InscripcionRepository');
