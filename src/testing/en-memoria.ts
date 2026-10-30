// Implementaciones en memoria de los puertos del dominio: permiten probar los casos de uso sin base de datos
import { Actor, Rol } from '../shared/domain/actor';
import { Reloj } from '../shared/domain/reloj';
import { Usuario } from '../modules/usuarios/domain/usuario';
import {
  CredencialesUsuario,
  DatosUsuario,
  UsuarioRepository,
} from '../modules/usuarios/domain/usuario.repository';
import { PasswordHasher } from '../modules/usuarios/domain/password-hasher';
import { Materia } from '../modules/materias/domain/materia';
import {
  DatosMateria,
  MateriaRepository,
} from '../modules/materias/domain/materia.repository';
import { InscripcionRepository } from '../modules/materias/domain/inscripcion.repository';
import { Examen } from '../modules/examenes/domain/examen';
import { Intento } from '../modules/examenes/domain/intento';
import {
  CambiosExamen,
  DatosExamen,
  DatosIntento,
  ExamenRepository,
  IntentoRepository,
} from '../modules/examenes/domain/examen.repository';

let secuencia = 0;
const nuevoId = () => (++secuencia).toString(16).padStart(24, '0');

export class RelojFijo implements Reloj {
  constructor(public fecha: Date) {}
  ahora(): Date {
    return this.fecha;
  }
}

export class HasherFalso implements PasswordHasher {
  hash(password: string): Promise<string> {
    return Promise.resolve(`hash:${password}`);
  }
  coincide(password: string, hash: string): Promise<boolean> {
    return Promise.resolve(hash === `hash:${password}`);
  }
}

export class UsuariosEnMemoria implements UsuarioRepository {
  readonly registros = new Map<string, Usuario & { passwordHash: string }>();

  crear(datos: DatosUsuario): Promise<Usuario> {
    const id = nuevoId();
    this.registros.set(id, { ...datos, id, materiaIds: [] });
    return Promise.resolve(this.publico(id)!);
  }
  actualizar(
    id: string,
    cambios: Partial<DatosUsuario>,
  ): Promise<Usuario | null> {
    const actual = this.registros.get(id);
    if (actual) this.registros.set(id, { ...actual, ...cambios });
    return Promise.resolve(this.publico(id));
  }
  buscarPorId(id: string): Promise<Usuario | null> {
    return Promise.resolve(this.publico(id));
  }
  buscarPorIds(ids: string[]): Promise<Usuario[]> {
    return Promise.resolve(
      ids.map((id) => this.publico(id)).filter((u): u is Usuario => u !== null),
    );
  }
  buscarCredenciales(correo: string): Promise<CredencialesUsuario | null> {
    const r = [...this.registros.values()].find((u) => u.correo === correo);
    return Promise.resolve(
      r ? { usuario: this.publico(r.id)!, passwordHash: r.passwordHash } : null,
    );
  }
  existeCorreo(correo: string, excluirId?: string): Promise<boolean> {
    return Promise.resolve(
      [...this.registros.values()].some(
        (u) => u.correo === correo && u.id !== excluirId,
      ),
    );
  }
  existeConRol(rol: Rol): Promise<boolean> {
    return Promise.resolve(
      [...this.registros.values()].some((u) => u.rol === rol),
    );
  }
  listar(rol?: Rol): Promise<Usuario[]> {
    return this.buscarPorIds(
      [...this.registros.values()]
        .filter((u) => !rol || u.rol === rol)
        .map((u) => u.id),
    );
  }
  private publico(id: string): Usuario | null {
    const r = this.registros.get(id);
    if (!r) return null;
    return {
      id: r.id,
      nombre: r.nombre,
      correo: r.correo,
      rol: r.rol,
      materiaIds: r.materiaIds,
    };
  }
}

export class MateriasEnMemoria implements MateriaRepository {
  readonly registros = new Map<string, Materia>();

  crear(datos: DatosMateria): Promise<Materia> {
    const materia = { ...datos, id: nuevoId() };
    this.registros.set(materia.id, materia);
    return Promise.resolve(materia);
  }
  actualizar(
    id: string,
    cambios: Partial<DatosMateria>,
  ): Promise<Materia | null> {
    const actual = this.registros.get(id);
    if (!actual) return Promise.resolve(null);
    const materia = { ...actual, ...cambios };
    this.registros.set(id, materia);
    return Promise.resolve(materia);
  }
  eliminar(id: string): Promise<boolean> {
    return Promise.resolve(this.registros.delete(id));
  }
  buscarPorId(id: string): Promise<Materia | null> {
    return Promise.resolve(this.registros.get(id) ?? null);
  }
  buscarPorIds(ids: string[]): Promise<Materia[]> {
    return Promise.resolve(
      ids.map((id) => this.registros.get(id)).filter((m): m is Materia => !!m),
    );
  }
  listar(): Promise<Materia[]> {
    return Promise.resolve([...this.registros.values()]);
  }
  listarPorMaestro(maestroId: string): Promise<Materia[]> {
    return Promise.resolve(
      [...this.registros.values()].filter((m) => m.maestroId === maestroId),
    );
  }
}

export class InscripcionesEnMemoria implements InscripcionRepository {
  readonly pares = new Set<string>();

  constructor(private readonly usuarios: UsuariosEnMemoria) {}

  inscribir(alumnoIds: string[], materiaId: string): Promise<void> {
    alumnoIds
      .filter((id) => this.usuarios.registros.get(id)?.rol === Rol.ALUMNO)
      .forEach((id) => this.pares.add(`${id}:${materiaId}`));
    return Promise.resolve();
  }
  darDeBaja(alumnoId: string, materiaId: string): Promise<void> {
    this.pares.delete(`${alumnoId}:${materiaId}`);
    return Promise.resolve();
  }
  estaInscrito(alumnoId: string, materiaId: string): Promise<boolean> {
    return Promise.resolve(this.pares.has(`${alumnoId}:${materiaId}`));
  }
  materiasDeAlumno(alumnoId: string): Promise<string[]> {
    return Promise.resolve(
      [...this.pares]
        .filter((p) => p.startsWith(`${alumnoId}:`))
        .map((p) => p.split(':')[1]),
    );
  }
  alumnosDeMateria(materiaId: string): Promise<Usuario[]> {
    const ids = [...this.pares]
      .filter((p) => p.endsWith(`:${materiaId}`))
      .map((p) => p.split(':')[0]);
    return this.usuarios.buscarPorIds(ids);
  }
}

export class ExamenesEnMemoria implements ExamenRepository {
  readonly registros = new Map<string, Examen>();

  crear(datos: DatosExamen): Promise<Examen> {
    const examen = { ...datos, id: nuevoId() };
    this.registros.set(examen.id, examen);
    return Promise.resolve(examen);
  }
  actualizar(id: string, cambios: CambiosExamen): Promise<Examen | null> {
    const actual = this.registros.get(id);
    if (!actual) return Promise.resolve(null);
    const examen = { ...actual, ...cambios };
    this.registros.set(id, examen);
    return Promise.resolve(examen);
  }
  eliminar(id: string): Promise<void> {
    this.registros.delete(id);
    return Promise.resolve();
  }
  buscarPorId(id: string): Promise<Examen | null> {
    return Promise.resolve(this.registros.get(id) ?? null);
  }
  buscarPorSemana(materiaId: string, semana: number): Promise<Examen | null> {
    const examen = [...this.registros.values()].find(
      (e) => e.materiaId === materiaId && e.semana === semana,
    );
    return Promise.resolve(examen ?? null);
  }
  listarPorMateria(materiaId: string): Promise<Examen[]> {
    return Promise.resolve(
      [...this.registros.values()].filter((e) => e.materiaId === materiaId),
    );
  }
}

export class IntentosEnMemoria implements IntentoRepository {
  readonly registros: Intento[] = [];

  constructor(private readonly reloj: Reloj) {}

  crear(datos: DatosIntento): Promise<Intento> {
    const intento = { ...datos, id: nuevoId(), fecha: this.reloj.ahora() };
    this.registros.push(intento);
    return Promise.resolve(intento);
  }
  buscar(examenId: string, alumnoId: string): Promise<Intento | null> {
    return Promise.resolve(
      this.registros.find(
        (i) => i.examenId === examenId && i.alumnoId === alumnoId,
      ) ?? null,
    );
  }
  listarDeAlumno(alumnoId: string, examenIds: string[]): Promise<Intento[]> {
    return Promise.resolve(
      this.registros.filter(
        (i) => i.alumnoId === alumnoId && examenIds.includes(i.examenId),
      ),
    );
  }
  listarPorExamen(examenId: string): Promise<Intento[]> {
    return Promise.resolve(
      this.registros.filter((i) => i.examenId === examenId),
    );
  }
  existeParaExamen(examenId: string): Promise<boolean> {
    return Promise.resolve(this.registros.some((i) => i.examenId === examenId));
  }
  eliminarPorExamen(examenId: string): Promise<void> {
    this.registros.splice(
      0,
      this.registros.length,
      ...this.registros.filter((i) => i.examenId !== examenId),
    );
    return Promise.resolve();
  }
}

export const actorDe = (usuario: Usuario): Actor => ({
  id: usuario.id,
  correo: usuario.correo,
  rol: usuario.rol,
});
