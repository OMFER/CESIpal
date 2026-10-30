import {
  ConflictoError,
  NoEncontradoError,
  SinPermisoError,
} from '../../../shared/domain/errores';
import { crearEscenario, preguntasDeEjemplo } from '../../../testing/escenario';
import { TipoExamen } from '../../examenes/domain/examen';
import { ObtenerMisGrupos } from './consultar-grupos';
import { EliminarMateria } from './gestionar-materias';
import { EliminarGrupo } from './gestionar-grupos';

describe('AccesoGrupos', () => {
  it('deja leer al admin, a la maestra del grupo y al alumno inscrito', async () => {
    const { accesoGrupos, grupo, actores } = await crearEscenario();
    for (const actor of [actores.admin, actores.maestra, actores.alumno]) {
      await expect(
        accesoGrupos.paraLeer(grupo.id, actor),
      ).resolves.toMatchObject({ grupo });
    }
  });

  it('rechaza al alumno no inscrito y a la maestra de otro grupo', async () => {
    const { accesoGrupos, grupo, actores } = await crearEscenario();
    await expect(
      accesoGrupos.paraLeer(grupo.id, actores.intruso),
    ).rejects.toThrow(SinPermisoError);
    await expect(
      accesoGrupos.paraLeer(grupo.id, actores.otraMaestra),
    ).rejects.toThrow(SinPermisoError);
    await expect(
      accesoGrupos.paraLeer('f'.repeat(24), actores.admin),
    ).rejects.toThrow(NoEncontradoError);
  });
});

describe('AccesoMaterias', () => {
  it('la materia la editan el admin y quien imparte uno de sus grupos', async () => {
    const { accesoMaterias, materia, actores } = await crearEscenario();
    await expect(
      accesoMaterias.paraEditar(materia.id, actores.maestra),
    ).resolves.toEqual(materia);
    await expect(
      accesoMaterias.paraEditar(materia.id, actores.admin),
    ).resolves.toEqual(materia);
    await expect(
      accesoMaterias.paraEditar(materia.id, actores.otraMaestra),
    ).rejects.toThrow(SinPermisoError);
    await expect(
      accesoMaterias.paraEditar(materia.id, actores.alumno),
    ).rejects.toThrow(SinPermisoError);
  });

  it('el contenido lo leen los alumnos inscritos en algún grupo de la materia', async () => {
    const { accesoMaterias, materia, actores } = await crearEscenario();
    await expect(
      accesoMaterias.paraLeer(materia.id, actores.alumno),
    ).resolves.toEqual(materia);
    await expect(
      accesoMaterias.paraLeer(materia.id, actores.intruso),
    ).rejects.toThrow(SinPermisoError);
  });
});

describe('ObtenerMisGrupos', () => {
  it('muestra a cada actor sus grupos con la semana actual de ese grupo', async () => {
    const e = await crearEscenario();
    const caso = new ObtenerMisGrupos(
      e.grupos,
      e.inscripciones,
      e.materias,
      e.usuarios,
      e.reloj,
    );

    const [delAlumno] = await caso.ejecutar(e.actores.alumno);
    expect(delAlumno.semanaActual).toBe(3);
    expect(delAlumno.materia?.nombre).toBe('Creatividad');
    expect(delAlumno.maestro?.nombre).toBe('Ana');
    expect(delAlumno.semanas).toHaveLength(16);
    expect(await caso.ejecutar(e.actores.intruso)).toHaveLength(0);
    expect(await caso.ejecutar(e.actores.otraMaestra)).toHaveLength(0);
  });
});

describe('Persistencia: la materia se conserva, los datos de alumnos viven en el grupo', () => {
  it('no se puede borrar una materia que tiene grupos', async () => {
    const e = await crearEscenario();
    await expect(
      new EliminarMateria(e.materias, e.grupos, e.eventos).ejecutar(
        e.materia.id,
      ),
    ).rejects.toThrow(ConflictoError);
  });

  it('borrar un grupo quita inscripciones e intentos, pero conserva la materia, su contenido y sus exámenes', async () => {
    const e = await crearEscenario();
    const examen = await e.examenes.crear({
      materiaId: e.materia.id,
      tipo: TipoExamen.SEMANAL,
      semana: 3,
      titulo: 'S3',
      puntajeMaximo: 100,
      diasExtra: 0,
      preguntas: preguntasDeEjemplo(),
    });
    await e.clases.crear({
      materiaId: e.materia.id,
      semana: 3,
      tema: 'Tema',
      recursos: [],
    });
    await e.intentos.crear({
      examenId: examen.id,
      grupoId: e.grupo.id,
      alumnoId: e.actores.alumno.id,
      respuestas: [0, 1],
      aciertos: 2,
      totalPreguntas: 2,
      calificacion: 100,
    });

    await new EliminarGrupo(e.grupos, e.inscripciones, e.eventos).ejecutar(
      e.grupo.id,
    );

    expect(await e.inscripciones.gruposDeAlumno(e.actores.alumno.id)).toEqual(
      [],
    );
    expect(e.intentos.registros).toHaveLength(0);
    expect(await e.materias.buscarPorId(e.materia.id)).not.toBeNull();
    expect(await e.examenes.listarPorMateria(e.materia.id)).toHaveLength(1);
    expect(await e.clases.listarPorMateria(e.materia.id)).toHaveLength(1);
  });

  it('borrar una materia sin grupos se lleva su contenido y sus exámenes', async () => {
    const e = await crearEscenario();
    await e.examenes.crear({
      materiaId: e.materia.id,
      tipo: TipoExamen.FINAL,
      titulo: 'Final',
      puntajeMaximo: 100,
      diasExtra: 0,
      preguntas: preguntasDeEjemplo(),
    });
    await e.clases.crear({
      materiaId: e.materia.id,
      semana: 1,
      tema: 'Tema',
      recursos: [],
    });
    await new EliminarGrupo(e.grupos, e.inscripciones, e.eventos).ejecutar(
      e.grupo.id,
    );

    await new EliminarMateria(e.materias, e.grupos, e.eventos).ejecutar(
      e.materia.id,
    );

    expect(await e.materias.buscarPorId(e.materia.id)).toBeNull();
    expect(await e.examenes.listarPorMateria(e.materia.id)).toHaveLength(0);
    expect(await e.clases.listarPorMateria(e.materia.id)).toHaveLength(0);
  });
});
