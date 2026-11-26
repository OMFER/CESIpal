import {
  ConflictoError,
  DatosInvalidosError,
  NoEncontradoError,
  SinPermisoError,
} from '../../../shared/domain/errores';
import { crearEscenario, DIAS } from '../../../testing/escenario';
import { EstadoPlan } from '../domain/plan';
import { ObtenerMisGrupos } from './consultar-grupos';
import {
  ActualizarMateria,
  CrearMateria,
  EliminarMateria,
  ListarMisMaterias,
} from './gestionar-materias';
import { ActualizarGrupo, CrearGrupo, EliminarGrupo } from './gestionar-grupos';
import { CrearPlan, EliminarPlan } from './gestionar-planes';

describe('AccesoGrupos', () => {
  it('deja leer al admin, a los maestros del plan y al alumno inscrito', async () => {
    const { accesoGrupos, grupo, actores } = await crearEscenario();
    for (const actor of [
      actores.admin,
      actores.ana,
      actores.berta,
      actores.alumno,
    ]) {
      const contexto = await accesoGrupos.paraLeer(grupo.id, actor);
      expect(contexto.grupo).toEqual(grupo);
      expect(contexto.materias.map((m) => m.nombre)).toEqual([
        'Historia',
        'Matemáticas',
        'Química',
      ]);
    }
  });

  it('rechaza al alumno no inscrito', async () => {
    const { accesoGrupos, grupo, actores } = await crearEscenario();
    await expect(
      accesoGrupos.paraLeer(grupo.id, actores.intruso),
    ).rejects.toThrow(SinPermisoError);
    await expect(
      accesoGrupos.paraLeer('f'.repeat(24), actores.admin),
    ).rejects.toThrow(NoEncontradoError);
  });
});

describe('AccesoMaterias', () => {
  it('una materia la corrigen el admin y su maestro asignado', async () => {
    const { accesoMaterias, matematicas, actores } = await crearEscenario();
    for (const actor of [actores.admin, actores.ana]) {
      await expect(
        accesoMaterias.paraEditar(matematicas.id, actor),
      ).resolves.toMatchObject({ materia: matematicas });
    }
    for (const actor of [actores.berta, actores.alumno]) {
      await expect(
        accesoMaterias.paraEditar(matematicas.id, actor),
      ).rejects.toThrow(SinPermisoError);
    }
  });

  it('la leen los alumnos de un grupo que cursa su plan', async () => {
    const { accesoMaterias, quimica, actores } = await crearEscenario();
    await expect(
      accesoMaterias.paraLeer(quimica.id, actores.alumno),
    ).resolves.toMatchObject({ materia: quimica });
    await expect(
      accesoMaterias.paraLeer(quimica.id, actores.intruso),
    ).rejects.toThrow(SinPermisoError);
  });
});

describe('planes', () => {
  it('un plan nuevo es la versión 1 en borrador y no repite nombre', async () => {
    const e = await crearEscenario();
    const crear = new CrearPlan(e.planes, e.bitacora);
    const plan = await crear.ejecutar(
      { nombre: '  Bachillerato  ' },
      e.actores.admin,
    );
    expect(plan).toMatchObject({
      nombre: 'Bachillerato',
      version: 1,
      estado: EstadoPlan.BORRADOR,
    });
    await expect(
      crear.ejecutar({ nombre: 'Prepa intensiva' }, e.actores.admin),
    ).rejects.toThrow(ConflictoError);
    expect(await e.bitacora.listarDePlan(plan.id)).toHaveLength(1);
  });

  it('un plan con grupos no se borra; sin grupos se va con su contenido', async () => {
    const e = await crearEscenario();
    const eliminar = new EliminarPlan(
      e.planes,
      e.materias,
      e.grupos,
      e.bitacora,
      e.eventos,
    );
    await expect(eliminar.ejecutar(e.plan.id)).rejects.toThrow(ConflictoError);

    await e.grupos.eliminar(e.grupo.id);
    await eliminar.ejecutar(e.plan.id);
    expect(await e.planes.buscarPorId(e.plan.id)).toBeNull();
    expect(await e.materias.listarPorPlan(e.plan.id)).toEqual([]);
    expect(await e.examenes.listarPorMateria(e.matematicas.id)).toEqual([]);
    expect(await e.clases.listarPorMateria(e.matematicas.id)).toEqual([]);
  });
});

describe('materias', () => {
  it('en un plan publicado no se agregan, quitan ni mueven materias', async () => {
    const e = await crearEscenario();
    const crear = new CrearMateria(
      e.planes,
      e.materias,
      e.usuarios,
      e.bitacora,
    );
    const actualizar = new ActualizarMateria(
      e.planes,
      e.materias,
      e.usuarios,
      e.bitacora,
    );
    const eliminar = new EliminarMateria(
      e.planes,
      e.materias,
      e.bitacora,
      e.eventos,
    );
    await expect(
      crear.ejecutar(
        { planId: e.plan.id, nombre: 'Física', bloque: 2 },
        e.actores.admin,
      ),
    ).rejects.toThrow(/ya está publicado/);
    await expect(
      actualizar.ejecutar(e.quimica.id, { bloque: 1 }, e.actores.admin),
    ).rejects.toThrow(ConflictoError);
    await expect(
      eliminar.ejecutar(e.quimica.id, e.actores.admin),
    ).rejects.toThrow(ConflictoError);
  });

  it('el nombre y el maestro se corrigen aunque esté publicado, y queda registrado', async () => {
    const e = await crearEscenario();
    const actualizar = new ActualizarMateria(
      e.planes,
      e.materias,
      e.usuarios,
      e.bitacora,
    );
    const materia = await actualizar.ejecutar(
      e.quimica.id,
      { nombre: 'Química I', maestroId: e.actores.berta.id },
      e.actores.admin,
    );
    expect(materia).toMatchObject({
      nombre: 'Química I',
      maestroId: e.actores.berta.id,
    });
    const [cambio] = await e.bitacora.listarDePlan(e.plan.id);
    expect(cambio).toMatchObject({
      entidad: 'materia',
      accion: 'actualizar',
      autorId: e.actores.admin.id,
      antes: { nombre: 'Química' },
      despues: { nombre: 'Química I' },
    });

    await expect(
      actualizar.ejecutar(
        e.quimica.id,
        { maestroId: e.actores.alumno.id },
        e.actores.admin,
      ),
    ).rejects.toThrow('no corresponde a un maestro');
    const sinMaestro = await actualizar.ejecutar(
      e.quimica.id,
      { maestroId: null },
      e.actores.admin,
    );
    expect(sinMaestro.maestroId).toBeUndefined();
  });

  it('cada maestro ve las materias que tiene asignadas', async () => {
    const e = await crearEscenario();
    const mias = await new ListarMisMaterias(e.materias, e.planes).ejecutar(
      e.actores.ana,
    );
    expect(mias.map((m) => [m.materia.nombre, m.plan.version])).toEqual([
      ['Matemáticas', 1],
      ['Química', 1],
    ]);
  });
});

describe('grupos', () => {
  it('solo se abre con un plan publicado y empezando en lunes', async () => {
    const e = await crearEscenario();
    const crear = new CrearGrupo(e.grupos, e.planes);
    const borrador = await e.planes.crear({
      nombre: 'Otro',
      version: 1,
      estado: EstadoPlan.BORRADOR,
    });
    const lunes = new Date('2026-11-02T00:00:00Z');
    await expect(
      crear.ejecutar({ planId: borrador.id, nombre: 'G', fechaInicio: lunes }),
    ).rejects.toThrow(/es un borrador/);
    await expect(
      crear.ejecutar({
        planId: e.plan.id,
        nombre: 'G',
        fechaInicio: new Date('2026-11-03T00:00:00Z'),
      }),
    ).rejects.toThrow(DatosInvalidosError);
    await expect(
      crear.ejecutar({ planId: e.plan.id, nombre: ' G2 ', fechaInicio: lunes }),
    ).resolves.toMatchObject({ nombre: 'G2' });
  });

  it('la fecha de inicio solo cambia antes de que el grupo empiece', async () => {
    const e = await crearEscenario();
    const actualizar = new ActualizarGrupo(e.grupos, e.reloj);
    await expect(
      actualizar.ejecutar(e.grupo.id, {
        fechaInicio: new Date('2026-11-02T00:00:00Z'),
      }),
    ).rejects.toThrow('ya empezó');
    await expect(
      actualizar.ejecutar(e.grupo.id, { nombre: 'Renombrado' }),
    ).resolves.toMatchObject({ nombre: 'Renombrado' });

    const futuro = await e.grupos.crear({
      planId: e.plan.id,
      nombre: 'Futuro',
      fechaInicio: new Date(e.hoy.getTime() + DIAS(3)),
    });
    await expect(
      actualizar.ejecutar(futuro.id, {
        fechaInicio: new Date('2026-11-09T00:00:00Z'),
      }),
    ).resolves.toMatchObject({
      fechaInicio: new Date('2026-11-09T00:00:00Z'),
    });
  });

  it('borrar un grupo saca a sus alumnos y borra sus intentos', async () => {
    const e = await crearEscenario();
    const examen = await e.examen(e.matematicas.id, 2, 1);
    await e.intentos.crear({
      examenId: examen.id,
      grupoId: e.grupo.id,
      alumnoId: e.actores.alumno.id,
      respuestas: [1, 0],
      aciertos: 2,
      totalPreguntas: 2,
      calificacion: 10,
    });
    await new EliminarGrupo(e.grupos, e.inscripciones, e.eventos).ejecutar(
      e.grupo.id,
    );
    expect(await e.inscripciones.gruposDeAlumno(e.actores.alumno.id)).toEqual(
      [],
    );
    expect(e.intentos.registros).toHaveLength(0);
    // El plan y sus exámenes se conservan
    expect(await e.examenes.listarPorMateria(e.matematicas.id)).toHaveLength(4);
  });
});

describe('ObtenerMisGrupos', () => {
  it('muestra el calendario de 4 semanas del grupo, con sus materias por bloque', async () => {
    const e = await crearEscenario();
    const caso = new ObtenerMisGrupos(
      e.grupos,
      e.inscripciones,
      e.planes,
      e.materias,
      e.usuarios,
      e.reloj,
    );

    const [delAlumno] = await caso.ejecutar(e.actores.alumno);
    expect(delAlumno.semanaActual).toBe(2);
    expect(delAlumno.plan?.nombre).toBe('Prepa intensiva');
    expect(delAlumno.semanas.map((s) => [s.bloque, s.estado])).toEqual([
      [1, 'completada'],
      [1, 'actual'],
      [2, 'futura'],
      [2, 'futura'],
    ]);
    expect(
      delAlumno.materias.map((m) => [m.materia.nombre, m.maestro?.nombre]),
    ).toEqual([
      ['Historia', 'Berta'],
      ['Matemáticas', 'Ana'],
      ['Química', 'Ana'],
    ]);
    expect(await caso.ejecutar(e.actores.intruso)).toHaveLength(0);
    expect(await caso.ejecutar(e.actores.berta)).toHaveLength(1);
  });
});
