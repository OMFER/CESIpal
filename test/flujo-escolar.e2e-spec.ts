import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Connection } from 'mongoose';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';

const DIA = 24 * 60 * 60 * 1000;
const haceDias = (dias: number) =>
  new Date(Date.now() - dias * DIA).toISOString().slice(0, 10);

const preguntas = [
  {
    enunciado: '¿Primera fase?',
    opciones: ['Empatizar', 'Prototipar'],
    respuestaCorrecta: 0,
  },
  {
    enunciado: '¿Cuántas fases?',
    opciones: ['3', '5', '7'],
    respuestaCorrecta: 1,
  },
];

describe('Flujo escolar (e2e)', () => {
  let app: INestApplication<App>;
  let api: ReturnType<typeof request>;
  const t: Record<string, string> = {};
  const id: Record<string, string> = {};

  const como = (rol: string) => ({ Authorization: `Bearer ${t[rol]}` });
  const login = async (correo: string, password: string) =>
    (await api.post('/auth/login').send({ correo, password }).expect(201)).body
      .access_token as string;

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

  it('el admin crea cuentas, la materia y un grupo que va en la semana 3', async () => {
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
    id.maestra = await crear('Ana', 'maestro');
    id.alumno = await crear('Luis', 'alumno');
    id.intruso = await crear('Otro', 'alumno');

    id.materia = (
      await api
        .post('/materias')
        .set(como('admin'))
        .send({ nombre: 'Creatividad' })
        .expect(201)
    ).body._id;
    const grupo = await api
      .post('/grupos')
      .set(como('admin'))
      .send({
        materiaId: id.materia,
        maestroId: id.maestra,
        nombre: 'Grupo 05',
        periodo: '2026-B',
        fechaInicio: haceDias(15),
      })
      .expect(201);
    id.grupo = grupo.body._id;
    expect(grupo.body).toMatchObject({
      semanaActual: 3,
      materia: { nombre: 'Creatividad', totalSemanas: 16 },
    });

    await api
      .post(`/grupos/${id.grupo}/alumnos`)
      .set(como('admin'))
      .send({ alumnoIds: [id.alumno] })
      .expect(201);
    t.maestra = await login('ana@e.mx', 'Ana123');
    t.alumno = await login('luis@e.mx', 'Luis123');
    t.intruso = await login('otro@e.mx', 'Otro123');
  });

  it('la maestra publica el contenido y los exámenes de la materia', async () => {
    await api
      .post('/clases')
      .set(como('maestra'))
      .send({
        materiaId: id.materia,
        semana: 3,
        tema: 'Design thinking',
        recursos: [
          {
            tipo: 'youtube',
            titulo: 'Video',
            url: 'https://youtu.be/dQw4w9WgXcQ',
          },
        ],
        links: { grabacion: 'https://drive.google.com/file/d/abc/view' },
      })
      .expect(201);

    const examen = (datos: object) =>
      api
        .post('/examenes')
        .set(como('maestra'))
        .send({ materiaId: id.materia, titulo: 'Examen', preguntas, ...datos });
    await examen({ tipo: 'Reposicion', semana: 3 }).expect(400);
    id.semanal = (
      await examen({ tipo: 'Semanal', semana: 3 }).expect(201)
    ).body._id;
    id.reposicion = (
      await examen({ tipo: 'Reposicion', semana: 3 }).expect(201)
    ).body._id;
    id.final = (await examen({ tipo: 'Final' }).expect(201)).body._id;
    await examen({ tipo: 'Final' }).expect(409);
    await examen({ tipo: 'Final', semana: 2 }).expect(400);
  });

  it('el alumno ve su grupo, el contenido de la semana y sus exámenes con su ventana', async () => {
    const mios = await api.get('/grupos/mios').set(como('alumno')).expect(200);
    expect(mios.body).toHaveLength(1);
    expect(mios.body[0]).toMatchObject({
      _id: id.grupo,
      semanaActual: 3,
      maestro: { nombre: 'Ana' },
    });

    const contenido = await api
      .get(`/clases/materia/${id.materia}/semana/3`)
      .set(como('alumno'))
      .expect(200);
    expect(contenido.body.links.grabacion).toContain('drive.google.com');

    const semana = await api
      .get(`/grupos/${id.grupo}/examenes/semana/3`)
      .set(como('alumno'))
      .expect(200);
    expect(semana.body.semanal).toMatchObject({
      ventana: { estado: 'abierta' },
      miIntento: null,
      totalPreguntas: 2,
    });
    expect(semana.body.reposicion.ventana.estado).toBe('proxima');

    const lista = await api
      .get(`/grupos/${id.grupo}/examenes`)
      .set(como('alumno'))
      .expect(200);
    expect(lista.body.map((e: { tipo: string }) => e.tipo)).toEqual([
      'Semanal',
      'Reposicion',
      'Final',
    ]);
  });

  it('el alumno no recibe las respuestas antes de responder', async () => {
    const examen = await api
      .get(`/grupos/${id.grupo}/examenes/${id.semanal}`)
      .set(como('alumno'))
      .expect(200);
    expect(examen.body.preguntas).toHaveLength(2);
    expect(
      examen.body.preguntas.every((p: object) => !('respuestaCorrecta' in p)),
    ).toBe(true);

    const reposicion = await api
      .get(`/grupos/${id.grupo}/examenes/${id.reposicion}`)
      .set(como('alumno'))
      .expect(200);
    expect(reposicion.body.preguntas).toEqual([]);
  });

  it('responde una sola vez y ve en qué acertó y cuál era la respuesta correcta', async () => {
    const ruta = `/grupos/${id.grupo}/examenes/${id.semanal}/intentos`;
    await api
      .post(ruta)
      .set(como('alumno'))
      .send({ respuestas: [0] })
      .expect(400);
    const resultado = await api
      .post(ruta)
      .set(como('alumno'))
      .send({ respuestas: [0, 2] })
      .expect(201);
    expect(resultado.body).toMatchObject({
      aciertos: 1,
      totalPreguntas: 2,
      calificacion: 50,
    });
    expect(
      resultado.body.revision.map(
        (p: { acierto: boolean; respuestaCorrecta: number }) => [
          p.acierto,
          p.respuestaCorrecta,
        ],
      ),
    ).toEqual([
      [true, 0],
      [false, 1],
    ]);
    await api
      .post(ruta)
      .set(como('alumno'))
      .send({ respuestas: [0, 1] })
      .expect(409);

    const revision = await api
      .get(`/grupos/${id.grupo}/examenes/${id.semanal}`)
      .set(como('alumno'))
      .expect(200);
    expect(revision.body.preguntas[1]).toMatchObject({
      miRespuesta: 2,
      respuestaCorrecta: 1,
      acierto: false,
    });
  });

  it('la reposición y el final rechazan respuestas fuera de su ventana', async () => {
    for (const examen of [id.reposicion, id.final]) {
      const res = await api
        .post(`/grupos/${id.grupo}/examenes/${examen}/intentos`)
        .set(como('alumno'))
        .send({ respuestas: [0, 1] })
        .expect(403);
      expect(res.body.message).toMatch(/^El examen abre el/);
    }
  });

  it('dos envíos simultáneos del mismo alumno guardan un solo intento', async () => {
    // Un grupo cuyo semestre ya terminó: el final está abierto
    const grupo = await api
      .post('/grupos')
      .set(como('admin'))
      .send({
        materiaId: id.materia,
        maestroId: id.maestra,
        nombre: 'Grupo 01',
        periodo: '2026-A',
        fechaInicio: haceDias(16 * 7 + 2),
      })
      .expect(201);
    id.grupoAnterior = grupo.body._id;
    await api
      .post(`/grupos/${id.grupoAnterior}/alumnos`)
      .set(como('admin'))
      .send({ alumnoIds: [id.alumno] })
      .expect(201);

    const envios = await Promise.all(
      Array.from({ length: 5 }, () =>
        api
          .post(`/grupos/${id.grupoAnterior}/examenes/${id.final}/intentos`)
          .set(como('alumno'))
          .send({ respuestas: [0, 1] }),
      ),
    );
    expect(envios.map((r) => r.status).sort()).toEqual([
      201, 409, 409, 409, 409,
    ]);
  });

  it('las calificaciones toman la mejor nota de cada semana; la maestra ve a todo el grupo', async () => {
    const delAlumno = await api
      .get(`/grupos/${id.grupo}/calificaciones`)
      .set(como('alumno'))
      .expect(200);
    expect(delAlumno.body).toEqual([
      {
        alumno: expect.objectContaining({ nombre: 'Luis' }),
        semanas: [
          {
            semana: 3,
            semanal: { calificacion: 50, puntajeMaximo: 100 },
            reposicion: null,
            mejor: { calificacion: 50, puntajeMaximo: 100 },
          },
        ],
        final: null,
      },
    ]);
    const deLaMaestra = await api
      .get(`/grupos/${id.grupo}/examenes/${id.semanal}/intentos`)
      .set(como('maestra'))
      .expect(200);
    expect(
      deLaMaestra.body.map(
        (i: { alumno: { nombre: string } }) => i.alumno.nombre,
      ),
    ).toEqual(['Luis']);
  });

  it('nadie fuera del grupo ve sus datos ni edita la materia', async () => {
    await api.get(`/grupos/${id.grupo}`).set(como('intruso')).expect(403);
    await api
      .get(`/clases/materia/${id.materia}/semana/3`)
      .set(como('intruso'))
      .expect(403);
    await api
      .get(`/grupos/${id.grupo}/calificaciones`)
      .set(como('intruso'))
      .expect(403);
    await api
      .patch(`/examenes/${id.semanal}`)
      .set(como('alumno'))
      .send({ titulo: 'x' })
      .expect(403);
    await api
      .patch(`/examenes/${id.semanal}`)
      .set(como('maestra'))
      .send({ preguntas })
      .expect(409);
  });

  it('borrar un grupo se lleva los datos de los alumnos pero conserva la materia', async () => {
    await api.delete(`/materias/${id.materia}`).set(como('admin')).expect(409);
    await api.delete(`/grupos/${id.grupo}`).set(como('admin')).expect(204);
    await api
      .delete(`/grupos/${id.grupoAnterior}`)
      .set(como('admin'))
      .expect(204);

    const yo = await api.get('/usuarios/me').set(como('alumno')).expect(200);
    expect(yo.body.grupos).toEqual([]);
    await api.get(`/materias/${id.materia}`).set(como('admin')).expect(200);
    const examenes = await api
      .get(`/examenes/materia/${id.materia}`)
      .set(como('admin'))
      .expect(200);
    expect(examenes.body).toHaveLength(3);

    await api.delete(`/materias/${id.materia}`).set(como('admin')).expect(204);
    await api
      .get(`/examenes/materia/${id.materia}`)
      .set(como('admin'))
      .expect(404);
  });
});
