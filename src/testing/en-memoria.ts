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
import { Bitacora, Cambio, NuevoCambio } from '../shared/domain/bitacora';
import { Plan } from '../modules/planes/domain/plan';
import { Materia } from '../modules/planes/domain/materia';
import { Grupo } from '../modules/planes/domain/grupo';
import {
  CambiosPlan,
  DatosPlan,
  PlanRepository,
} from '../modules/planes/domain/plan.repository';
import {
  CambiosMateria,
  DatosMateria,
  MateriaRepository,
} from '../modules/planes/domain/materia.repository';
import {
  CambiosGrupo,
  DatosGrupo,
  GrupoRepository,
} from '../modules/planes/domain/grupo.repository';
import { InscripcionRepository } from '../modules/planes/domain/inscripcion.repository';
import { Clase } from '../modules/clases/domain/clase';
import {
  CambiosClase,
  ClaseRepository,
  DatosClase,
} from '../modules/clases/domain/clase.repository';
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

// Repositorio genérico por id: la base de los demás
class Tabla<T extends { id: string }> {
  readonly registros = new Map<string, T>();

  insertar(datos: Omit<T, 'id'>): T {
    const registro = { ...datos, id: nuevoId() } as T;
    this.registros.set(registro.id, registro);
    return registro;
  }
  modificar(id: string, cambios: Partial<T>): T | null {
    const actual = this.registros.get(id);
    if (!actual) return null;
    const registro = { ...actual, ...cambios };
    this.registros.set(id, registro);
    return registro;
  }
  todos(): T[] {
    return [...this.registros.values()];
  }
  porIds(ids: string[]): T[] {
    return ids
      .map((id) => this.registros.get(id))
      .filter((r): r is T => r !== undefined);
  }
}

export class UsuariosEnMemoria implements UsuarioRepository {
  readonly tabla = new Tabla<Usuario & { passwordHash: string }>();

  crear(datos: DatosUsuario): Promise<Usuario> {
    const r = this.tabla.insertar({ ...datos, grupoIds: [] });
    return Promise.resolve(this.publico(r));
  }
  actualizar(
    id: string,
    cambios: Partial<DatosUsuario>,
  ): Promise<Usuario | null> {
    const r = this.tabla.modificar(id, cambios);
    return Promise.resolve(r && this.publico(r));
  }
  buscarPorId(id: string): Promise<Usuario | null> {
    const r = this.tabla.registros.get(id);
    return Promise.resolve(r ? this.publico(r) : null);
  }
  buscarPorIds(ids: string[]): Promise<Usuario[]> {
    return Promise.resolve(this.tabla.porIds(ids).map((r) => this.publico(r)));
  }
  buscarCredenciales(correo: string): Promise<CredencialesUsuario | null> {
    const r = this.tabla.todos().find((u) => u.correo === correo);
    return Promise.resolve(
      r ? { usuario: this.publico(r), passwordHash: r.passwordHash } : null,
    );
  }
  existeCorreo(correo: string, excluirId?: string): Promise<boolean> {
    return Promise.resolve(
      this.tabla.todos().some((u) => u.correo === correo && u.id !== excluirId),
    );
  }
  existeConRol(rol: Rol): Promise<boolean> {
    return Promise.resolve(this.tabla.todos().some((u) => u.rol === rol));
  }
  listar(rol?: Rol): Promise<Usuario[]> {
    return Promise.resolve(
      this.tabla
        .todos()
        .filter((u) => !rol || u.rol === rol)
        .map((r) => this.publico(r)),
    );
  }
  publico(r: Usuario & { passwordHash: string }): Usuario {
    return {
      id: r.id,
      nombre: r.nombre,
      correo: r.correo,
      rol: r.rol,
      grupoIds: r.grupoIds,
    };
  }
}

export class PlanesEnMemoria implements PlanRepository {
  readonly tabla = new Tabla<Plan>();

  crear(datos: DatosPlan): Promise<Plan> {
    return Promise.resolve(this.tabla.insertar(datos));
  }
  actualizar(id: string, cambios: CambiosPlan): Promise<Plan | null> {
    return Promise.resolve(this.tabla.modificar(id, cambios));
  }
  eliminar(id: string): Promise<void> {
    this.tabla.registros.delete(id);
    return Promise.resolve();
  }
  buscarPorId(id: string): Promise<Plan | null> {
    return Promise.resolve(this.tabla.registros.get(id) ?? null);
  }
  buscarPorIds(ids: string[]): Promise<Plan[]> {
    return Promise.resolve(this.tabla.porIds(ids));
  }
  listar(): Promise<Plan[]> {
    return Promise.resolve(this.tabla.todos());
  }
  ultimaVersion(nombre: string): Promise<number> {
    return Promise.resolve(
      Math.max(
        0,
        ...this.tabla
          .todos()
          .filter((p) => p.nombre === nombre)
          .map((p) => p.version),
      ),
    );
  }
}

const porBloque = (a: Materia, b: Materia) =>
  a.bloque - b.bloque || a.nombre.localeCompare(b.nombre);

export class MateriasEnMemoria implements MateriaRepository {
  readonly tabla = new Tabla<Materia>();

  crear(datos: DatosMateria): Promise<Materia> {
    return Promise.resolve(this.tabla.insertar(datos));
  }
  actualizar(
    id: string,
    { maestroId, ...cambios }: CambiosMateria,
  ): Promise<Materia | null> {
    const materia = this.tabla.modificar(id, {
      ...cambios,
      ...(maestroId !== undefined && { maestroId: maestroId ?? undefined }),
    });
    return Promise.resolve(materia);
  }
  eliminar(id: string): Promise<void> {
    this.tabla.registros.delete(id);
    return Promise.resolve();
  }
  buscarPorId(id: string): Promise<Materia | null> {
    return Promise.resolve(this.tabla.registros.get(id) ?? null);
  }
  listarPorPlan(planId: string): Promise<Materia[]> {
    return Promise.resolve(
      this.tabla
        .todos()
        .filter((m) => m.planId === planId)
        .sort(porBloque),
    );
  }
  listarPorMaestro(maestroId: string): Promise<Materia[]> {
    return Promise.resolve(
      this.tabla
        .todos()
        .filter((m) => m.maestroId === maestroId)
        .sort(porBloque),
    );
  }
}

export class GruposEnMemoria implements GrupoRepository {
  readonly tabla = new Tabla<Grupo>();

  crear(datos: DatosGrupo): Promise<Grupo> {
    return Promise.resolve(this.tabla.insertar(datos));
  }
  actualizar(id: string, cambios: CambiosGrupo): Promise<Grupo | null> {
    return Promise.resolve(this.tabla.modificar(id, cambios));
  }
  eliminar(id: string): Promise<void> {
    this.tabla.registros.delete(id);
    return Promise.resolve();
  }
  buscarPorId(id: string): Promise<Grupo | null> {
    return Promise.resolve(this.tabla.registros.get(id) ?? null);
  }
  buscarPorIds(ids: string[]): Promise<Grupo[]> {
    return Promise.resolve(this.tabla.porIds(ids));
  }
  listar(): Promise<Grupo[]> {
    return Promise.resolve(this.tabla.todos());
  }
  listarPorPlanes(planIds: string[]): Promise<Grupo[]> {
    return Promise.resolve(
      this.tabla.todos().filter((g) => planIds.includes(g.planId)),
    );
  }
  existeDePlan(planId: string): Promise<boolean> {
    return Promise.resolve(this.tabla.todos().some((g) => g.planId === planId));
  }
}

export class InscripcionesEnMemoria implements InscripcionRepository {
  constructor(private readonly usuarios: UsuariosEnMemoria) {}

  private cambiarGrupos(alumnoId: string, cambio: (ids: string[]) => string[]) {
    const alumno = this.usuarios.tabla.registros.get(alumnoId);
    if (alumno) alumno.grupoIds = cambio(alumno.grupoIds);
  }

  inscribir(alumnoIds: string[], grupoId: string): Promise<void> {
    alumnoIds
      .filter((id) => this.usuarios.tabla.registros.get(id)?.rol === Rol.ALUMNO)
      .forEach((id) =>
        this.cambiarGrupos(id, (ids) => [...new Set([...ids, grupoId])]),
      );
    return Promise.resolve();
  }
  darDeBaja(alumnoId: string, grupoId: string): Promise<void> {
    this.cambiarGrupos(alumnoId, (ids) => ids.filter((g) => g !== grupoId));
    return Promise.resolve();
  }
  vaciarGrupo(grupoId: string): Promise<void> {
    this.usuarios.tabla
      .todos()
      .forEach((u) =>
        this.cambiarGrupos(u.id, (ids) => ids.filter((g) => g !== grupoId)),
      );
    return Promise.resolve();
  }
  estaInscrito(alumnoId: string, grupoId: string): Promise<boolean> {
    return Promise.resolve(
      !!this.usuarios.tabla.registros.get(alumnoId)?.grupoIds.includes(grupoId),
    );
  }
  gruposDeAlumno(alumnoId: string): Promise<string[]> {
    return Promise.resolve(
      this.usuarios.tabla.registros.get(alumnoId)?.grupoIds ?? [],
    );
  }
  alumnosDeGrupo(grupoId: string): Promise<Usuario[]> {
    return Promise.resolve(
      this.usuarios.tabla
        .todos()
        .filter((u) => u.rol === Rol.ALUMNO && u.grupoIds.includes(grupoId))
        .map((u) => this.usuarios.publico(u)),
    );
  }
}

export class ClasesEnMemoria implements ClaseRepository {
  readonly tabla = new Tabla<Clase>();

  crear(datos: DatosClase): Promise<Clase> {
    return Promise.resolve(this.tabla.insertar(datos));
  }
  actualizar(id: string, cambios: CambiosClase): Promise<Clase | null> {
    return Promise.resolve(this.tabla.modificar(id, cambios));
  }
  eliminar(id: string): Promise<void> {
    this.tabla.registros.delete(id);
    return Promise.resolve();
  }
  buscarPorId(id: string): Promise<Clase | null> {
    return Promise.resolve(this.tabla.registros.get(id) ?? null);
  }
  buscarPorSemana(materiaId: string, semana: number): Promise<Clase | null> {
    return Promise.resolve(
      this.tabla
        .todos()
        .find((c) => c.materiaId === materiaId && c.semana === semana) ?? null,
    );
  }
  listarPorMateria(materiaId: string): Promise<Clase[]> {
    return this.listarPorMaterias([materiaId]);
  }
  listarPorMaterias(materiaIds: string[]): Promise<Clase[]> {
    return Promise.resolve(
      this.tabla.todos().filter((c) => materiaIds.includes(c.materiaId)),
    );
  }
  eliminarDeMateria(materiaId: string): Promise<void> {
    this.tabla
      .todos()
      .filter((c) => c.materiaId === materiaId)
      .forEach((c) => this.tabla.registros.delete(c.id));
    return Promise.resolve();
  }
}

export class ExamenesEnMemoria implements ExamenRepository {
  readonly tabla = new Tabla<Examen>();

  crear(datos: DatosExamen): Promise<Examen> {
    return Promise.resolve(this.tabla.insertar(datos));
  }
  actualizar(id: string, cambios: CambiosExamen): Promise<Examen | null> {
    return Promise.resolve(this.tabla.modificar(id, cambios));
  }
  eliminar(id: string): Promise<void> {
    this.tabla.registros.delete(id);
    return Promise.resolve();
  }
  buscarPorId(id: string): Promise<Examen | null> {
    return Promise.resolve(this.tabla.registros.get(id) ?? null);
  }
  buscarEnMateria(
    materiaId: string,
    semana: number,
    numero: number,
  ): Promise<Examen | null> {
    return Promise.resolve(
      this.tabla
        .todos()
        .find(
          (e) =>
            e.materiaId === materiaId &&
            e.semana === semana &&
            e.numero === numero,
        ) ?? null,
    );
  }
  listarPorMateria(materiaId: string): Promise<Examen[]> {
    return this.listarPorMaterias([materiaId]);
  }
  listarPorMaterias(materiaIds: string[]): Promise<Examen[]> {
    return Promise.resolve(
      this.tabla.todos().filter((e) => materiaIds.includes(e.materiaId)),
    );
  }
  eliminarDeMateria(materiaId: string): Promise<void> {
    this.tabla
      .todos()
      .filter((e) => e.materiaId === materiaId)
      .forEach((e) => this.tabla.registros.delete(e.id));
    return Promise.resolve();
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
  listarDeAlumno(grupoId: string, alumnoId: string): Promise<Intento[]> {
    return Promise.resolve(
      this.registros.filter(
        (i) => i.grupoId === grupoId && i.alumnoId === alumnoId,
      ),
    );
  }
  listarDeGrupo(grupoId: string, examenId?: string): Promise<Intento[]> {
    return Promise.resolve(
      this.registros.filter(
        (i) => i.grupoId === grupoId && (!examenId || i.examenId === examenId),
      ),
    );
  }
  existeParaExamen(examenId: string): Promise<boolean> {
    return Promise.resolve(this.registros.some((i) => i.examenId === examenId));
  }
  eliminarDeGrupo(grupoId: string): Promise<void> {
    return this.quitar((i) => i.grupoId === grupoId);
  }
  private quitar(condicion: (i: Intento) => boolean): Promise<void> {
    const quedan = this.registros.filter((i) => !condicion(i));
    this.registros.splice(0, this.registros.length, ...quedan);
    return Promise.resolve();
  }
}

export class BitacoraEnMemoria implements Bitacora {
  readonly cambios: Cambio[] = [];

  constructor(private readonly reloj: Reloj) {}

  registrar(cambio: NuevoCambio): Promise<void> {
    this.cambios.unshift({
      ...cambio,
      id: nuevoId(),
      fecha: this.reloj.ahora(),
    });
    return Promise.resolve();
  }
  listarDePlan(planId: string): Promise<Cambio[]> {
    return Promise.resolve(this.cambios.filter((c) => c.planId === planId));
  }
  eliminarDePlan(planId: string): Promise<void> {
    const quedan = this.cambios.filter((c) => c.planId !== planId);
    this.cambios.splice(0, this.cambios.length, ...quedan);
    return Promise.resolve();
  }
}

export const actorDe = (usuario: Usuario): Actor => ({
  id: usuario.id,
  correo: usuario.correo,
  rol: usuario.rol,
});
