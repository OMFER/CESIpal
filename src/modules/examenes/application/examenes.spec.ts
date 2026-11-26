import {
  ConflictoError,
  DatosInvalidosError,
  SinPermisoError,
} from '../../../shared/domain/errores';
import { crearEscenario, preguntasDeEjemplo } from '../../../testing/escenario';
import { EstadoPlan } from '../../planes/domain/plan';
import {
  ListarExamenesDeGrupo,
  ObtenerExamenEnGrupo,
  ObtenerExamenesDeSemana,
  ResponderExamen,
} from './examenes-de-grupo';
import {
  ActualizarExamen,
  CrearExamen,
  EliminarExamen,
  ImportarExamenes,
} from './gestionar-examenes';
import {
  ListarIntentosDeGrupo,
  ObtenerCalificaciones,
} from './resultados-de-grupo';

async function preparar() {
  const e = await crearEscenario();
  const enGrupo = [e.accesoGrupos, e.examenes, e.intentos, e.reloj] as const;
  return {
    ...e,
    listar: new ListarExamenesDeGrupo(...enGrupo),
    deSemana: new ObtenerExamenesDeSemana(...enGrupo),
    obtener: new ObtenerExamenEnGrupo(...enGrupo),
    responder: new ResponderExamen(...enGrupo),
    actualizar: new ActualizarExamen(
      e.accesoMaterias,
      e.examenes,
      e.intentos,
      e.bitacora,
    ),
    crear: new CrearExamen(e.accesoMaterias, e.examenes, e.bitacora),
    eliminar: new EliminarExamen(e.accesoMaterias, e.examenes, e.bitacora),
    importar: new ImportarExamenes(e.accesoMaterias, e.examenes, e.bitacora),
    calificaciones: new ObtenerCalificaciones(
      e.accesoGrupos,
      e.inscripciones,
      e.examenes,
      e.intentos,
      e.usuarios,
    ),
    intentosDeGrupo: new ListarIntentosDeGrupo(
      e.accesoGrupos,
      e.examenes,
      e.intentos,
      e.usuarios,
    ),
    // Una materia de Ana en un plan nuevo, todavía en borrador
    async materiaEnBorrador() {
      const plan = await e.planes.crear({
        nombre: 'Borrador',
        version: 1,
        estado: EstadoPlan.BORRADOR,
      });
      return e.materias.crear({
        planId: plan.id,
        nombre: 'Física',
        bloque: 1,
        maestroId: e.actores.ana.id,
      });
    },
  };
}

describe('exámenes en el grupo', () => {
  it('cada examen abre según la semana del grupo en que cae su materia', async () => {
    const e = await preparar();
    const lista = await e.listar.ejecutar(e.grupo.id, e.actores.alumno);
    expect(
      lista.map((r) => [
        r.semanaDelGrupo,
        r.materia.nombre,
        r.examen.numero,
        r.ventana.estado,
      ]),
    ).toEqual([
      [1, 'Historia', 1, 'cerrada'],
      [1, 'Historia', 2, 'cerrada'],
      [1, 'Matemáticas', 1, 'cerrada'],
      [1, 'Matemáticas', 2, 'cerrada'],
      [2, 'Historia', 1, 'abierta'],
      [2, 'Historia', 2, 'abierta'],
      [2, 'Matemáticas', 1, 'abierta'],
      [2, 'Matemáticas', 2, 'abierta'],
      [3, 'Química', 1, 'proxima'],
      [3, 'Química', 2, 'proxima'],
      [4, 'Química', 1, 'proxima'],
      [4, 'Química', 2, 'proxima'],
    ]);
    expect(lista.every((r) => r.miIntento === null)).toBe(true);
  });

  it('da los dos exámenes de una semana de una materia', async () => {
    const e = await preparar();
    const semana = await e.deSemana.ejecutar(
      e.grupo.id,
      e.quimica.id,
      1,
      e.actores.alumno,
    );
    expect(semana.map((r) => r.ventana.abre.toISOString())).toEqual([
      // Semana 3 del grupo: lunes 2 y jueves 5 de noviembre
      '2026-11-02T00:00:00.000Z',
      '2026-11-05T00:00:00.000Z',
    ]);
  });

  it('el alumno no ve preguntas fuera de la ventana ni respuestas antes de responder', async () => {
    const e = await preparar();
    const ver = async (semana: number, materiaId = e.matematicas.id) =>
      (
        await e.obtener.ejecutar(
          e.grupo.id,
          (await e.examen(materiaId, semana, 1)).id,
          e.actores.alumno,
        )
      ).preguntas.modo;
    expect(await ver(2)).toBe('sinRespuestas');
    expect(await ver(1)).toBe('ocultas');
    expect(await ver(1, e.quimica.id)).toBe('ocultas');

    const delMaestro = await e.obtener.ejecutar(
      e.grupo.id,
      (await e.examen(e.matematicas.id, 1, 1)).id,
      e.actores.ana,
    );
    expect(delMaestro.preguntas.modo).toBe('conRespuestas');
  });

  it('responde una vez; la respuesta correcta espera a que cierre el examen', async () => {
    const e = await preparar();
    const examen = await e.examen(e.matematicas.id, 2, 2);
    const resultado = await e.responder.ejecutar(
      e.grupo.id,
      examen.id,
      [1, 1],
      e.actores.alumno,
    );
    expect(resultado.intento).toMatchObject({
      aciertos: 1,
      totalPreguntas: 2,
      calificacion: 5,
    });
    expect(resultado.revision.map((p) => p.acierto)).toEqual([true, false]);
    expect(resultado.revision[1]).not.toHaveProperty('respuestaCorrecta');

    await expect(
      e.responder.ejecutar(e.grupo.id, examen.id, [1, 0], e.actores.alumno),
    ).rejects.toThrow(ConflictoError);
  });

  it('rechaza exámenes cerrados, próximos y a quien no es alumno', async () => {
    const e = await preparar();
    const cerrado = await e.examen(e.matematicas.id, 1, 1);
    const proximo = await e.examen(e.quimica.id, 1, 1);
    await expect(
      e.responder.ejecutar(e.grupo.id, cerrado.id, [1, 0], e.actores.alumno),
    ).rejects.toThrow('ya cerró');
    await expect(
      e.responder.ejecutar(e.grupo.id, proximo.id, [1, 0], e.actores.alumno),
    ).rejects.toThrow('abre el');
    await expect(
      e.responder.ejecutar(
        e.grupo.id,
        (await e.examen(e.matematicas.id, 2, 1)).id,
        [1, 0],
        e.actores.ana,
      ),
    ).rejects.toThrow(SinPermisoError);
  });

  it('la boleta promedia los cuatro exámenes de cada materia', async () => {
    const e = await preparar();
    for (const numero of [1, 2]) {
      await e.responder.ejecutar(
        e.grupo.id,
        (await e.examen(e.matematicas.id, 2, numero)).id,
        [1, 0],
        e.actores.alumno,
      );
    }
    const { materias, boletas } = await e.calificaciones.ejecutar(
      e.grupo.id,
      e.actores.alumno,
    );
    expect(materias.map((m) => m.nombre)).toEqual([
      'Historia',
      'Matemáticas',
      'Química',
    ]);
    expect(boletas).toHaveLength(1);
    const mate = boletas[0].materias[1];
    expect(mate.notas.map((n) => n.calificacion)).toEqual([null, null, 10, 10]);
    expect(mate).toMatchObject({ promedio: 5, aprobada: false });

    const delMaestro = await e.calificaciones.ejecutar(
      e.grupo.id,
      e.actores.berta,
    );
    expect(delMaestro.boletas.map((b) => b.alumno.nombre)).toEqual(['Luis']);
  });

  it('el maestro ve los intentos de todo el grupo; el alumno solo el suyo', async () => {
    const e = await preparar();
    const examen = await e.examen(e.historia.id, 2, 1);
    await e.responder.ejecutar(e.grupo.id, examen.id, [1, 0], e.actores.alumno);
    const delMaestro = await e.intentosDeGrupo.ejecutar(
      e.grupo.id,
      examen.id,
      e.actores.berta,
    );
    expect(delMaestro.map((i) => i.alumno?.nombre)).toEqual(['Luis']);
  });
});

describe('correcciones a exámenes', () => {
  it('con respuestas registradas solo se corrige la redacción', async () => {
    const e = await preparar();
    const examen = await e.examen(e.matematicas.id, 2, 1);
    await e.responder.ejecutar(e.grupo.id, examen.id, [1, 0], e.actores.alumno);

    const [primera, segunda] = preguntasDeEjemplo();
    await expect(
      e.actualizar.ejecutar(
        examen.id,
        { preguntas: [{ ...primera, respuestaCorrecta: 0 }, segunda] },
        e.actores.ana,
      ),
    ).rejects.toThrow(/solo puedes corregir la redacción/);
    await expect(
      e.actualizar.ejecutar(examen.id, { preguntas: [primera] }, e.actores.ana),
    ).rejects.toThrow(ConflictoError);

    const corregido = await e.actualizar.ejecutar(
      examen.id,
      {
        preguntas: [{ ...primera, enunciado: '¿Cuánto es 2 más 2?' }, segunda],
        diasExtra: 2,
      },
      e.actores.ana,
    );
    expect(corregido.preguntas[0].enunciado).toBe('¿Cuánto es 2 más 2?');
    expect(corregido.diasExtra).toBe(2);
    const [cambio] = await e.bitacora.listarDePlan(e.plan.id);
    expect(cambio).toMatchObject({
      entidad: 'examen',
      entidadId: examen.id,
      autorId: e.actores.ana.id,
    });
  });

  it('sin respuestas, las preguntas cambian libremente', async () => {
    const e = await preparar();
    const examen = await e.examen(e.quimica.id, 1, 1);
    const [primera] = preguntasDeEjemplo();
    const nuevo = await e.actualizar.ejecutar(
      examen.id,
      { preguntas: [primera] },
      e.actores.ana,
    );
    expect(nuevo.preguntas).toHaveLength(1);
  });

  it('solo el maestro asignado o el admin corrigen', async () => {
    const e = await preparar();
    const examen = await e.examen(e.matematicas.id, 1, 1);
    await expect(
      e.actualizar.ejecutar(examen.id, { titulo: 'x' }, e.actores.berta),
    ).rejects.toThrow(SinPermisoError);
    await expect(
      e.actualizar.ejecutar(examen.id, { titulo: 'x' }, e.actores.admin),
    ).resolves.toMatchObject({ titulo: 'x' });
  });

  it('en un plan publicado no se crean ni se borran exámenes', async () => {
    const e = await preparar();
    const examen = await e.examen(e.matematicas.id, 1, 1);
    await expect(e.eliminar.ejecutar(examen.id, e.actores.ana)).rejects.toThrow(
      ConflictoError,
    );
    await expect(
      e.crear.ejecutar(
        {
          materiaId: e.matematicas.id,
          semana: 1,
          numero: 1,
          titulo: 'x',
          preguntas: preguntasDeEjemplo(),
        },
        e.actores.ana,
      ),
    ).rejects.toThrow(/ya está publicado/);
  });

  it('en borrador se crea uno por semana y número', async () => {
    const e = await preparar();
    const materia = await e.materiaEnBorrador();
    const datos = {
      materiaId: materia.id,
      semana: 2,
      numero: 2,
      titulo: 'Final de la materia',
      preguntas: preguntasDeEjemplo(),
    };
    const examen = await e.crear.ejecutar(datos, e.actores.ana);
    expect(examen).toMatchObject({ semana: 2, numero: 2, diasExtra: 0 });
    await expect(e.crear.ejecutar(datos, e.actores.ana)).rejects.toThrow(
      ConflictoError,
    );
    await expect(
      e.crear.ejecutar({ ...datos, semana: 3 }, e.actores.ana),
    ).rejects.toThrow(DatosInvalidosError);
    await e.eliminar.ejecutar(examen.id, e.actores.ana);
    expect(await e.examenes.listarPorMateria(materia.id)).toEqual([]);
  });
});

describe('importar exámenes', () => {
  const columnas = [
    'semana',
    'examen',
    'pregunta',
    'opcion_a',
    'opcion_b',
    'correcta',
  ];
  const hoja = (...filas: string[][]) => ({
    columnas,
    filas: filas.map((celdas, i) => ({
      fila: i + 2,
      valores: Object.fromEntries(columnas.map((c, j) => [c, celdas[j]])),
    })),
  });

  it('crea los exámenes nuevos y reemplaza los que ya existían', async () => {
    const e = await preparar();
    const materia = await e.materiaEnBorrador();
    await e.importar.ejecutar(
      materia.id,
      hoja(['1', '1', '¿Viejo?', 'a', 'b', 'A']),
      e.actores.ana,
    );
    const importados = await e.importar.ejecutar(
      materia.id,
      hoja(
        ['1', '1', '¿Nuevo?', 'a', 'b', 'B'],
        ['1', '2', '¿Otro?', 'a', 'b', 'A'],
      ),
      e.actores.ana,
    );
    expect(importados.map((x) => [x.semana, x.numero, x.titulo])).toEqual([
      [1, 1, 'Semana 1 · Examen 1'],
      [1, 2, 'Semana 1 · Examen 2'],
    ]);
    const guardados = await e.examenes.listarPorMateria(materia.id);
    expect(guardados).toHaveLength(2);
    expect(guardados[0].preguntas[0]).toMatchObject({
      enunciado: '¿Nuevo?',
      respuestaCorrecta: 1,
    });
  });

  it('con un error no guarda nada', async () => {
    const e = await preparar();
    const materia = await e.materiaEnBorrador();
    await expect(
      e.importar.ejecutar(
        materia.id,
        hoja(
          ['1', '1', '¿Bien?', 'a', 'b', 'A'],
          ['1', '1', '¿Mal?', 'a', 'b', 'Z'],
        ),
        e.actores.ana,
      ),
    ).rejects.toThrow(DatosInvalidosError);
    expect(await e.examenes.listarPorMateria(materia.id)).toEqual([]);
  });

  it('no se importa sobre un plan publicado', async () => {
    const e = await preparar();
    await expect(
      e.importar.ejecutar(
        e.matematicas.id,
        hoja(['1', '1', '¿x?', 'a', 'b', 'A']),
        e.actores.ana,
      ),
    ).rejects.toThrow(ConflictoError);
  });
});
