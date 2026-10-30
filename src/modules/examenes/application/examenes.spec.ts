import {
  ConflictoError,
  DatosInvalidosError,
  SinPermisoError,
} from '../../../shared/domain/errores';
import {
  crearEscenario,
  DIAS,
  preguntasDeEjemplo,
} from '../../../testing/escenario';
import { TipoExamen } from '../domain/examen';
import {
  ActualizarExamen,
  CrearExamen,
  EliminarExamen,
  NuevoExamen,
} from './gestionar-examenes';
import {
  ListarExamenesDeGrupo,
  ObtenerExamenEnGrupo,
  ObtenerExamenesDeSemana,
  ResponderExamen,
} from './examenes-de-grupo';
import { ObtenerCalificaciones } from './resultados-de-grupo';

async function preparar() {
  const e = await crearEscenario();
  const crear = new CrearExamen(e.accesoMaterias, e.examenes);
  const nuevo = (datos: Partial<NuevoExamen> & Pick<NuevoExamen, 'tipo'>) =>
    crear.ejecutar(
      {
        materiaId: e.materia.id,
        titulo: 'Examen',
        preguntas: preguntasDeEjemplo(),
        ...datos,
      },
      e.actores.maestra,
    );
  const enGrupo = [e.accesoGrupos, e.examenes, e.intentos, e.reloj] as const;
  return {
    ...e,
    crear,
    nuevo,
    responder: new ResponderExamen(...enGrupo),
    obtener: new ObtenerExamenEnGrupo(...enGrupo),
    deSemana: new ObtenerExamenesDeSemana(...enGrupo),
    listar: new ListarExamenesDeGrupo(...enGrupo),
    calificaciones: new ObtenerCalificaciones(
      e.accesoGrupos,
      e.inscripciones,
      e.examenes,
      e.intentos,
      e.usuarios,
    ),
  };
}

describe('CrearExamen', () => {
  it('aplica 100 puntos y 0 días extra por defecto', async () => {
    const { nuevo } = await preparar();
    await expect(
      nuevo({ tipo: TipoExamen.SEMANAL, semana: 3 }),
    ).resolves.toMatchObject({
      puntajeMaximo: 100,
      diasExtra: 0,
    });
  });

  it('exige semana en Semanal y Reposición, y la prohíbe en el Final', async () => {
    const { nuevo } = await preparar();
    await expect(nuevo({ tipo: TipoExamen.SEMANAL })).rejects.toThrow(
      DatosInvalidosError,
    );
    await expect(nuevo({ tipo: TipoExamen.FINAL, semana: 2 })).rejects.toThrow(
      DatosInvalidosError,
    );
    await expect(
      nuevo({ tipo: TipoExamen.SEMANAL, semana: 17 }),
    ).rejects.toThrow(DatosInvalidosError);
  });

  it('la Reposición requiere el Semanal de su semana', async () => {
    const { nuevo } = await preparar();
    await expect(
      nuevo({ tipo: TipoExamen.REPOSICION, semana: 3 }),
    ).rejects.toThrow('no tiene examen semanal');
    await nuevo({ tipo: TipoExamen.SEMANAL, semana: 3 });
    await expect(
      nuevo({ tipo: TipoExamen.REPOSICION, semana: 3 }),
    ).resolves.toMatchObject({
      tipo: TipoExamen.REPOSICION,
    });
  });

  it('un examen de cada tipo por semana y un solo Final', async () => {
    const { nuevo } = await preparar();
    await nuevo({ tipo: TipoExamen.SEMANAL, semana: 3 });
    await nuevo({ tipo: TipoExamen.FINAL });
    await expect(
      nuevo({ tipo: TipoExamen.SEMANAL, semana: 3 }),
    ).rejects.toThrow(ConflictoError);
    await expect(nuevo({ tipo: TipoExamen.FINAL })).rejects.toThrow(
      'ya tiene examen final',
    );
  });

  it('solo lo crea quien imparte la materia', async () => {
    const { crear, materia, actores } = await preparar();
    const datos = {
      materiaId: materia.id,
      tipo: TipoExamen.FINAL,
      titulo: 'x',
      preguntas: preguntasDeEjemplo(),
    };
    await expect(crear.ejecutar(datos, actores.otraMaestra)).rejects.toThrow(
      SinPermisoError,
    );
    await expect(crear.ejecutar(datos, actores.alumno)).rejects.toThrow(
      SinPermisoError,
    );
  });
});

describe('ResponderExamen', () => {
  it('el Semanal de la semana actual se responde una sola vez y devuelve la revisión', async () => {
    const { nuevo, responder, grupo, actores } = await preparar();
    const examen = await nuevo({ tipo: TipoExamen.SEMANAL, semana: 3 });

    const { intento, revision } = await responder.ejecutar(
      grupo.id,
      examen.id,
      [0, 2],
      actores.alumno,
    );
    expect(intento).toMatchObject({
      aciertos: 1,
      totalPreguntas: 2,
      calificacion: 50,
    });
    expect(
      revision.map((p) => [p.miRespuesta, p.respuestaCorrecta, p.acierto]),
    ).toEqual([
      [0, 0, true],
      [2, 1, false],
    ]);
    await expect(
      responder.ejecutar(grupo.id, examen.id, [0, 1], actores.alumno),
    ).rejects.toThrow(ConflictoError);
  });

  it('respeta la ventana: semanas futuras, semanas pasadas y la reposición aún cerrada', async () => {
    const { nuevo, responder, grupo, actores } = await preparar();
    const futura = await nuevo({ tipo: TipoExamen.SEMANAL, semana: 5 });
    const pasada = await nuevo({ tipo: TipoExamen.SEMANAL, semana: 1 });
    await nuevo({ tipo: TipoExamen.SEMANAL, semana: 3 });
    const reposicion3 = await nuevo({ tipo: TipoExamen.REPOSICION, semana: 3 });
    const final = await nuevo({ tipo: TipoExamen.FINAL });

    for (const examen of [futura, reposicion3, final]) {
      await expect(
        responder.ejecutar(grupo.id, examen.id, [0, 1], actores.alumno),
      ).rejects.toThrow('El examen abre el');
    }
    await expect(
      responder.ejecutar(grupo.id, pasada.id, [0, 1], actores.alumno),
    ).rejects.toThrow('ya cerró');
  });

  it('la reposición abre al cerrar el semanal, y la mejor nota cuenta en la semana', async () => {
    const { nuevo, responder, calificaciones, grupo, actores, reloj, hoy } =
      await preparar();
    const semanal = await nuevo({ tipo: TipoExamen.SEMANAL, semana: 3 });
    const reposicion = await nuevo({ tipo: TipoExamen.REPOSICION, semana: 3 });
    await responder.ejecutar(grupo.id, semanal.id, [1, 1], actores.alumno); // 50

    reloj.fecha = new Date(hoy.getTime() + DIAS(7)); // ya es la semana 4
    await responder.ejecutar(grupo.id, reposicion.id, [0, 1], actores.alumno); // 100

    const [boleta] = await calificaciones.ejecutar(grupo.id, actores.alumno);
    expect(boleta.semanas).toEqual([
      expect.objectContaining({
        semana: 3,
        mejor: { calificacion: 100, puntajeMaximo: 100 },
      }),
    ]);
  });

  it('el mismo alumno puede volver a presentar la materia en un grupo de otro semestre', async () => {
    const e = await preparar();
    const examen = await e.nuevo({ tipo: TipoExamen.SEMANAL, semana: 3 });
    await e.responder.ejecutar(e.grupo.id, examen.id, [0, 1], e.actores.alumno);

    const otroGrupo = await e.grupos.crear({ ...e.grupo, periodo: '2027-A' });
    await e.inscripciones.inscribir([e.actores.alumno.id], otroGrupo.id);
    await expect(
      e.responder.ejecutar(otroGrupo.id, examen.id, [0, 0], e.actores.alumno),
    ).resolves.toBeDefined();
  });

  it('rechaza a alumnos no inscritos y a maestros', async () => {
    const { nuevo, responder, grupo, actores } = await preparar();
    const examen = await nuevo({ tipo: TipoExamen.SEMANAL, semana: 3 });
    await expect(
      responder.ejecutar(grupo.id, examen.id, [0, 1], actores.intruso),
    ).rejects.toThrow(SinPermisoError);
    await expect(
      responder.ejecutar(grupo.id, examen.id, [0, 1], actores.maestra),
    ).rejects.toThrow(SinPermisoError);
  });
});

describe('ObtenerExamenEnGrupo', () => {
  it('el alumno ve preguntas sin respuestas mientras está abierto y la revisión después', async () => {
    const { nuevo, obtener, responder, grupo, actores } = await preparar();
    const examen = await nuevo({ tipo: TipoExamen.SEMANAL, semana: 3 });

    const antes = await obtener.ejecutar(grupo.id, examen.id, actores.alumno);
    expect(antes.preguntas).toEqual({ modo: 'sinRespuestas' });
    expect(antes.miIntento).toBeNull();

    await responder.ejecutar(grupo.id, examen.id, [0, 0], actores.alumno);
    const despues = await obtener.ejecutar(grupo.id, examen.id, actores.alumno);
    expect(despues.preguntas.modo).toBe('revision');
    expect(despues.miIntento?.calificacion).toBe(50);
  });

  it('oculta las preguntas al alumno fuera de la ventana; la maestra siempre las ve con respuestas', async () => {
    const { nuevo, obtener, grupo, actores } = await preparar();
    const futura = await nuevo({ tipo: TipoExamen.SEMANAL, semana: 8 });
    await expect(
      obtener.ejecutar(grupo.id, futura.id, actores.alumno),
    ).resolves.toMatchObject({
      preguntas: { modo: 'ocultas' },
      ventana: { estado: 'proxima' },
    });
    await expect(
      obtener.ejecutar(grupo.id, futura.id, actores.maestra),
    ).resolves.toMatchObject({
      preguntas: { modo: 'conRespuestas' },
    });
  });
});

describe('Listados del grupo', () => {
  it('ordena por semana con la reposición después del semanal y el Final al último', async () => {
    const { nuevo, listar, deSemana, grupo, actores } = await preparar();
    await nuevo({ tipo: TipoExamen.FINAL });
    await nuevo({ tipo: TipoExamen.SEMANAL, semana: 4 });
    await nuevo({ tipo: TipoExamen.SEMANAL, semana: 3 });
    await nuevo({ tipo: TipoExamen.REPOSICION, semana: 3 });

    const lista = await listar.ejecutar(grupo.id, actores.alumno);
    expect(
      lista.map((r) => `${r.examen.tipo}${r.examen.semana ?? ''}`),
    ).toEqual(['Semanal3', 'Reposicion3', 'Semanal4', 'Final']);
    const semana3 = await deSemana.ejecutar(grupo.id, 3, actores.alumno);
    expect(semana3.semanal?.ventana.estado).toBe('abierta');
    expect(semana3.reposicion?.ventana.estado).toBe('proxima');
  });
});

describe('Edición de exámenes', () => {
  it('no cambia preguntas con respuestas, y no borra un semanal que tiene reposición', async () => {
    const e = await preparar();
    const semanal = await e.nuevo({ tipo: TipoExamen.SEMANAL, semana: 3 });
    await e.nuevo({ tipo: TipoExamen.REPOSICION, semana: 3 });
    await e.responder.ejecutar(
      e.grupo.id,
      semanal.id,
      [0, 1],
      e.actores.alumno,
    );

    const actualizar = new ActualizarExamen(
      e.accesoMaterias,
      e.examenes,
      e.intentos,
    );
    await expect(
      actualizar.ejecutar(
        semanal.id,
        { preguntas: preguntasDeEjemplo() },
        e.actores.maestra,
      ),
    ).rejects.toThrow(ConflictoError);
    await expect(
      actualizar.ejecutar(semanal.id, { diasExtra: 2 }, e.actores.maestra),
    ).resolves.toMatchObject({
      diasExtra: 2,
    });
    await expect(
      new EliminarExamen(e.accesoMaterias, e.examenes, e.intentos).ejecutar(
        semanal.id,
        e.actores.maestra,
      ),
    ).rejects.toThrow('tiene examen de reposición');
  });
});
