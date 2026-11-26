import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Connection, Types } from 'mongoose';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { MigracionAlPlanDeEstudios } from '../src/modules/publicacion/infrastructure/migracion-plan-de-estudios.bootstrap';

const DIA = 24 * 60 * 60 * 1000;
// La escuela está en Ciudad de México (UTC-6, sin horario de verano)
const hoyEnLaEscuela = new Date(Date.now() - 6 * 60 * 60 * 1000);
const diasDesdeElLunes = (hoyEnLaEscuela.getUTCDay() + 6) % 7;
// El grupo empezó el lunes de la semana pasada: hoy va en su semana 2
const lunesPasado = new Date(
  hoyEnLaEscuela.getTime() - (diasDesdeElLunes + 7) * DIA,
)
  .toISOString()
  .slice(0, 10);

const preguntas = [
  { enunciado: '¿2 + 2?', opciones: ['3', '4'], respuestaCorrecta: 1 },
  {
    enunciado: '¿Color del cielo?',
    opciones: ['Rojo', 'Verde', 'Azul'],
    respuestaCorrecta: 2,
  },
];

// La plantilla de Google Sheets exportada como CSV: los 4 exámenes, 2 preguntas cada uno
const csvDeExamenes = [
  'Semana,Examen,Título,Pregunta,Opción A,Opción B,Opción C,Correcta',
  ...[1, 2].flatMap((s) =>
    [1, 2].flatMap((n) => [
      `${s},${n},,¿2 + 2?,3,4,,B`,
      `${s},${n},,"¿Color del cielo?",Rojo,Verde,Azul,C`,
    ]),
  ),
].join('\r\n');

describe('Flujo escolar con plan de estudios (e2e)', () => {
  let app: INestApplication<App>;
  let api: ReturnType<typeof request>;
  const t: Record<string, string> = {};
  const id: Record<string, string> = {};

  const como = (rol: string) => ({ Authorization: `Bearer ${t[rol]}` });
  const login = async (correo: string, password: string) =>
    (await api.post('/auth/login').send({ correo, password }).expect(201)).body
      .access_token as string;
  const examenesDe = async (materia: string, rol = 'ana') =>
    (await api.get(`/examenes/materia/${materia}`).set(como(rol)).expect(200))
      .body as { _id: string; semana: number; numero: number }[];

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    await modulo.get<Connection>(getConnectionToken()).dropDatabase();
    app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
    api = request(app.getHttpServer());
    t.admin = await login('admin@escuela.mx', 'admin123');
  });

  afterAll(async () => {
    await app.get<Connection>(getConnectionToken()).dropDatabase();
    await app.close();
  });

  it('sin sesión no se pueden crear cuentas', async () => {
    await api
      .post('/usuarios')
      .send({ nombre: 'x', correo: 'x@x.mx', password: '123456', rol: 'admin' })
      .expect(401);
  });

  it('el admin crea las cuentas y un plan en borrador con dos materias', async () => {
    const crear = async (nombre: string, rol: string) =>
      (
        await api
          .post('/usuarios')
          .set(como('admin'))
          .send({
            nombre,
            correo: `${nombre.toLowerCase()}@e.mx`,
            password: `${nombre}123`,
            rol,
          })
          .expect(201)
      ).body._id as string;
    id.ana = await crear('Ana', 'maestro');
    id.alumno = await crear('Luis', 'alumno');
    id.eva = await crear('Eva', 'alumno');
    id.intruso = await crear('Otro', 'alumno');
    for (const nombre of ['ana', 'luis', 'eva', 'otro']) {
      const password = `${nombre[0].toUpperCase()}${nombre.slice(1)}123`;
      t[nombre === 'luis' ? 'alumno' : nombre === 'otro' ? 'intruso' : nombre] =
        await login(`${nombre}@e.mx`, password);
    }

    const plan = await api
      .post('/planes')
      .set(como('admin'))
      .send({ nombre: 'Prepa intensiva' })
      .expect(201);
    expect(plan.body).toMatchObject({ version: 1, estado: 'borrador' });
    id.plan = plan.body._id;

    const materia = async (nombre: string, bloque: number) =>
      (
        await api
          .post('/materias')
          .set(como('admin'))
          .send({ planId: id.plan, nombre, bloque, maestroId: id.ana })
          .expect(201)
      ).body._id as string;
    id.mate = await materia('Matemáticas', 1);
    id.quimica = await materia('Química', 2);

    const pendientes = await api
      .get(`/planes/${id.plan}/pendientes`)
      .set(como('admin'))
      .expect(200);
    expect(pendientes.body.listo).toBe(false);
    expect(pendientes.body.pendientes).toContain(
      'Matemáticas: falta el examen 1 de la semana 1',
    );
    await api
      .post('/grupos')
      .set(como('admin'))
      .send({ planId: id.plan, nombre: 'G', fechaInicio: lunesPasado })
      .expect(409);
  });

  it('la maestra captura el contenido e importa los exámenes desde la plantilla', async () => {
    for (const materiaId of [id.mate, id.quimica]) {
      for (const semana of [1, 2]) {
        await api
          .post('/clases')
          .set(como('ana'))
          .send({
            materiaId,
            semana,
            tema: `Tema ${semana}`,
            recursos: [
              {
                tipo: 'pdf',
                titulo: 'Lectura',
                url: 'https://drive.google.com/file/d/abc/view',
              },
            ],
            links: { grabacion: 'https://drive.google.com/file/d/rec/view' },
          })
          .expect(201);
      }
    }
    await api
      .post('/clases')
      .set(como('ana'))
      .send({ materiaId: id.mate, semana: 3, tema: 'x' })
      .expect(400);

    // Una hoja con errores no importa nada y dice qué filas corregir
    const conErrores = await api
      .post(`/examenes/materia/${id.mate}/importar`)
      .set(como('ana'))
      .send({
        csv: 'semana,examen,pregunta,opcion_a,opcion_b,correcta\n3,1,¿x?,a,b,Z',
      })
      .expect(400);
    expect(conErrores.body.detalles).toEqual([
      'Fila 2: la semana debe ser 1 o 2',
      'Fila 2: la respuesta correcta debe ser una de sus 2 opciones',
    ]);

    const importados = await api
      .post(`/examenes/materia/${id.mate}/importar`)
      .set(como('ana'))
      .send({ csv: csvDeExamenes })
      .expect(201);
    expect(importados.body).toHaveLength(4);
    expect(importados.body[1]).toMatchObject({
      semana: 1,
      numero: 2,
      titulo: 'Semana 1 · Examen 2',
      preguntas: [
        { enunciado: '¿2 + 2?', respuestaCorrecta: 1 },
        { enunciado: '¿Color del cielo?', respuestaCorrecta: 2 },
      ],
    });

    for (const semana of [1, 2]) {
      for (const numero of [1, 2]) {
        await api
          .post('/examenes')
          .set(como('ana'))
          .send({
            materiaId: id.quimica,
            semana,
            numero,
            titulo: `Química ${semana}.${numero}`,
            preguntas,
          })
          .expect(201);
      }
    }
  });

  it('el admin publica el plan y abre un grupo que va en su semana 2', async () => {
    const publicado = await api
      .post(`/planes/${id.plan}/publicar`)
      .set(como('admin'))
      .expect(201);
    expect(publicado.body.estado).toBe('publicado');

    await api
      .post('/grupos')
      .set(como('admin'))
      .send({
        planId: id.plan,
        nombre: 'Martes',
        fechaInicio: new Date(new Date(lunesPasado).getTime() + DIA)
          .toISOString()
          .slice(0, 10),
      })
      .expect(400);
    const grupo = await api
      .post('/grupos')
      .set(como('admin'))
      .send({
        planId: id.plan,
        nombre: 'Generación 1',
        fechaInicio: lunesPasado,
      })
      .expect(201);
    id.grupo = grupo.body._id;
    expect(grupo.body.fechaInicio).toBe(`${lunesPasado}T06:00:00.000Z`);
    expect(grupo.body).toMatchObject({ semanaActual: 2, plan: { version: 1 } });
    expect(grupo.body.semanas).toHaveLength(4);

    await api
      .post(`/grupos/${id.grupo}/alumnos`)
      .set(como('admin'))
      .send({ alumnoIds: [id.alumno, id.eva] })
      .expect(201);
  });

  it('el alumno ve su grupo, el contenido y los dos exámenes de la semana', async () => {
    const mios = await api.get('/grupos/mios').set(como('alumno')).expect(200);
    expect(mios.body).toHaveLength(1);
    expect(
      mios.body[0].materias.map((m: { nombre: string }) => m.nombre),
    ).toEqual(['Matemáticas', 'Química']);
    expect(mios.body[0].materias[0].maestro.nombre).toBe('Ana');

    const contenido = await api
      .get(`/clases/materia/${id.mate}/semana/2`)
      .set(como('alumno'))
      .expect(200);
    expect(contenido.body.links.grabacion).toContain('drive.google.com');
    await api
      .get(`/clases/materia/${id.mate}/semana/2`)
      .set(como('intruso'))
      .expect(403);

    const semana = await api
      .get(`/grupos/${id.grupo}/materias/${id.mate}/semanas/2/examenes`)
      .set(como('alumno'))
      .expect(200);
    expect(semana.body).toHaveLength(2);
    expect(semana.body[0]).toMatchObject({
      numero: 1,
      semanaDelGrupo: 2,
      ventana: { estado: 'abierta' },
      miIntento: null,
    });
    // El examen 2 abre el jueves
    expect(semana.body[1].ventana.estado).toBe(
      diasDesdeElLunes >= 3 ? 'abierta' : 'proxima',
    );
    id.examen = semana.body[0]._id;
  });

  it('el alumno responde una vez y no recibe la clave mientras el examen siga abierto', async () => {
    const examen = await api
      .get(`/grupos/${id.grupo}/examenes/${id.examen}`)
      .set(como('alumno'))
      .expect(200);
    expect(
      examen.body.preguntas.every((p: object) => !('respuestaCorrecta' in p)),
    ).toBe(true);

    const ruta = `/grupos/${id.grupo}/examenes/${id.examen}/intentos`;
    await api
      .post(ruta)
      .set(como('alumno'))
      .send({ respuestas: [1] })
      .expect(400);
    const resultado = await api
      .post(ruta)
      .set(como('alumno'))
      .send({ respuestas: [1, 0] })
      .expect(201);
    expect(resultado.body).toMatchObject({
      aciertos: 1,
      totalPreguntas: 2,
      calificacion: 5,
    });
    expect('respuestaCorrecta' in resultado.body.revision[1]).toBe(false);
    await api
      .post(ruta)
      .set(como('alumno'))
      .send({ respuestas: [1, 2] })
      .expect(409);

    const [quimica] = await examenesDe(id.quimica);
    const futuro = await api
      .post(`/grupos/${id.grupo}/examenes/${quimica._id}/intentos`)
      .set(como('alumno'))
      .send({ respuestas: [1, 2] })
      .expect(403);
    expect(futuro.body.message).toMatch(/^El examen abre el/);
  });

  it('cinco envíos simultáneos del mismo alumno guardan un solo intento', async () => {
    const envios = await Promise.all(
      Array.from({ length: 5 }, () =>
        api
          .post(`/grupos/${id.grupo}/examenes/${id.examen}/intentos`)
          .set(como('eva'))
          .send({ respuestas: [1, 2] }),
      ),
    );
    expect(envios.map((r) => r.status).sort()).toEqual([
      201, 409, 409, 409, 409,
    ]);
  });

  it('la boleta promedia los cuatro exámenes de cada materia', async () => {
    const res = await api
      .get(`/grupos/${id.grupo}/calificaciones`)
      .set(como('alumno'))
      .expect(200);
    expect(res.body.materias.map((m: { nombre: string }) => m.nombre)).toEqual([
      'Matemáticas',
      'Química',
    ]);
    expect(res.body.boletas).toHaveLength(1);
    expect(res.body.boletas[0].materias[0]).toMatchObject({
      materia: id.mate,
      // Solo presentó un examen (5) de cuatro
      promedio: 1.3,
      aprobada: false,
      completa: false,
    });

    const delMaestro = await api
      .get(`/grupos/${id.grupo}/calificaciones`)
      .set(como('ana'))
      .expect(200);
    expect(
      delMaestro.body.boletas.map(
        (b: { alumno: { nombre: string } }) => b.alumno.nombre,
      ),
    ).toEqual(['Eva', 'Luis']);
  });

  it('el plan publicado solo admite correcciones, y cada una queda registrada', async () => {
    await api
      .patch(`/examenes/${id.examen}`)
      .set(como('ana'))
      .send({
        preguntas: [{ ...preguntas[0], respuestaCorrecta: 0 }, preguntas[1]],
      })
      .expect(409);
    const corregido = await api
      .patch(`/examenes/${id.examen}`)
      .set(como('ana'))
      .send({
        preguntas: [
          { ...preguntas[0], enunciado: '¿Cuánto es 2 + 2?' },
          preguntas[1],
        ],
      })
      .expect(200);
    expect(corregido.body.preguntas[0].enunciado).toBe('¿Cuánto es 2 + 2?');

    const clases = await api
      .get(`/clases/materia/${id.mate}`)
      .set(como('ana'))
      .expect(200);
    await api
      .patch(`/clases/${clases.body[0]._id}`)
      .set(como('ana'))
      .send({
        links: { grabacion: 'https://drive.google.com/file/d/nueva/view' },
      })
      .expect(200);

    await api
      .post('/clases')
      .set(como('ana'))
      .send({ materiaId: id.mate, semana: 1, tema: 'x' })
      .expect(409);
    await api.delete(`/examenes/${id.examen}`).set(como('ana')).expect(409);
    await api.delete(`/materias/${id.mate}`).set(como('admin')).expect(409);
    await api
      .patch(`/materias/${id.mate}`)
      .set(como('admin'))
      .send({ bloque: 2 })
      .expect(409);
    await api
      .patch(`/examenes/${id.examen}`)
      .set(como('alumno'))
      .send({ titulo: 'x' })
      .expect(403);

    const cambios = await api
      .get(`/planes/${id.plan}/cambios`)
      .set(como('admin'))
      .expect(200);
    expect(
      cambios.body
        .slice(0, 2)
        .map((c: { entidad: string; accion: string }) => [c.entidad, c.accion]),
    ).toEqual([
      ['clase', 'actualizar'],
      ['examen', 'actualizar'],
    ]);
    expect(cambios.body[1]).toMatchObject({
      autor: id.ana,
      antes: { preguntas: [{ enunciado: '¿2 + 2?' }, {}] },
      despues: { preguntas: [{ enunciado: '¿Cuánto es 2 + 2?' }, {}] },
    });
  });

  it('una nueva versión copia todo a un borrador sin tocar a los grupos', async () => {
    const v2 = await api
      .post(`/planes/${id.plan}/versiones`)
      .set(como('admin'))
      .expect(201);
    expect(v2.body).toMatchObject({
      nombre: 'Prepa intensiva',
      version: 2,
      estado: 'borrador',
    });
    id.v2 = v2.body._id;
    const detalle = await api
      .get(`/planes/${id.v2}`)
      .set(como('admin'))
      .expect(200);
    expect(detalle.body.materias).toHaveLength(2);
    const copia = detalle.body.materias[0]._id as string;
    expect(await examenesDe(copia)).toHaveLength(4);

    const materias = await api
      .get('/materias/mias')
      .set(como('ana'))
      .expect(200);
    expect(
      materias.body.map((m: { nombre: string; plan: { version: number } }) => [
        m.nombre,
        m.plan.version,
      ]),
    ).toEqual(
      expect.arrayContaining([
        ['Matemáticas', 1],
        ['Matemáticas', 2],
      ]),
    );
  });

  it('borrar el grupo se lleva a sus alumnos; un plan sin grupos se puede borrar', async () => {
    await api.delete(`/planes/${id.plan}`).set(como('admin')).expect(409);
    await api.delete(`/grupos/${id.grupo}`).set(como('admin')).expect(204);
    const yo = await api.get('/usuarios/me').set(como('alumno')).expect(200);
    expect(yo.body.grupos).toEqual([]);

    await api.delete(`/planes/${id.v2}`).set(como('admin')).expect(204);
    await api.get(`/planes/${id.v2}`).set(como('admin')).expect(404);
    await api.get(`/planes/${id.plan}`).set(como('admin')).expect(200);
  });

  it('al arrancar, borra los datos del modelo anterior', async () => {
    const conexion = app.get<Connection>(getConnectionToken());
    const materiaVieja = new Types.ObjectId();
    await conexion.collection('materias').insertOne({
      _id: materiaVieja,
      nombre: 'Vieja',
      totalSemanas: 16,
    });
    await conexion.collection('examenes').insertOne({
      materia: materiaVieja,
      tipo: 'Final',
      titulo: 'Viejo',
    });
    await app.get(MigracionAlPlanDeEstudios).onApplicationBootstrap();
    expect(
      await conexion
        .collection('materias')
        .countDocuments({ _id: materiaVieja }),
    ).toBe(0);
    expect(
      await conexion.collection('examenes').countDocuments({ tipo: 'Final' }),
    ).toBe(0);
    // Los planes actuales no se tocan
    expect(await conexion.collection('materias').countDocuments()).toBe(2);
  });
});
