import {
  ConflictoError,
  DatosInvalidosError,
  SinPermisoError,
} from '../../../shared/domain/errores';
import { crearEscenario, preguntasDeEjemplo } from '../../../testing/escenario';
import { presentarExamen } from '../presentation/examen.presenter';
import { ActualizarExamen, CrearExamen } from './gestionar-examenes';
import { ObtenerExamenDeSemana } from './consultar-examenes';
import { ListarIntentos, ResponderExamen } from './responder-examen';

async function escenarioConExamen(fechaLimite?: Date) {
  const e = await crearEscenario();
  const examen = await new CrearExamen(e.acceso, e.examenes).ejecutar(
    {
      materiaId: e.materia.id,
      semana: 3,
      titulo: 'Semana 3',
      preguntas: preguntasDeEjemplo(),
      fechaLimite,
    },
    e.actores.maestra,
  );
  const responder = new ResponderExamen(
    e.acceso,
    e.examenes,
    e.intentos,
    e.reloj,
  );
  return { ...e, examen, responder };
}

describe('CrearExamen', () => {
  it('aplica tipo Semanal y 100 puntos por defecto', async () => {
    const { examen } = await escenarioConExamen();
    expect(examen.tipo).toBe('Semanal');
    expect(examen.puntajeMaximo).toBe(100);
  });

  it('rechaza una respuesta correcta que no es una de las opciones', async () => {
    const { acceso, examenes, materia, actores } = await crearEscenario();
    const preguntas = [
      { enunciado: '¿?', opciones: ['a', 'b'], respuestaCorrecta: 5 },
    ];
    await expect(
      new CrearExamen(acceso, examenes).ejecutar(
        { materiaId: materia.id, titulo: 'x', preguntas },
        actores.maestra,
      ),
    ).rejects.toThrow(DatosInvalidosError);
  });

  it('no permite dos exámenes en la misma semana ni semanas fuera del semestre', async () => {
    const { acceso, examenes, materia, actores } = await escenarioConExamen();
    const crear = new CrearExamen(acceso, examenes);
    const base = {
      materiaId: materia.id,
      titulo: 'x',
      preguntas: preguntasDeEjemplo(),
    };
    await expect(
      crear.ejecutar({ ...base, semana: 3 }, actores.maestra),
    ).rejects.toThrow(ConflictoError);
    await expect(
      crear.ejecutar({ ...base, semana: 17 }, actores.maestra),
    ).rejects.toThrow(DatosInvalidosError);
  });

  it('no deja crear exámenes a un alumno', async () => {
    const { acceso, examenes, materia, actores } = await crearEscenario();
    await expect(
      new CrearExamen(acceso, examenes).ejecutar(
        { materiaId: materia.id, titulo: 'x', preguntas: preguntasDeEjemplo() },
        actores.alumno,
      ),
    ).rejects.toThrow(SinPermisoError);
  });
});

describe('ResponderExamen', () => {
  it('califica proporcionalmente y guarda un solo intento', async () => {
    const { responder, examen, actores } = await escenarioConExamen();
    const intento = await responder.ejecutar(examen.id, [0, 2], actores.alumno);
    expect(intento).toMatchObject({
      aciertos: 1,
      totalPreguntas: 2,
      calificacion: 50,
    });
    await expect(
      responder.ejecutar(examen.id, [0, 1], actores.alumno),
    ).rejects.toThrow(ConflictoError);
  });

  it('rechaza respuestas incompletas', async () => {
    const { responder, examen, actores } = await escenarioConExamen();
    await expect(
      responder.ejecutar(examen.id, [0], actores.alumno),
    ).rejects.toThrow(DatosInvalidosError);
  });

  it('rechaza después de la fecha límite', async () => {
    // El escenario fija "hoy" en 2026-10-30 12:00 UTC
    const { responder, examen, actores } = await escenarioConExamen(
      new Date('2026-10-30T11:59:00Z'),
    );
    await expect(
      responder.ejecutar(examen.id, [0, 1], actores.alumno),
    ).rejects.toThrow(SinPermisoError);
  });

  it('rechaza a alumnos no inscritos y a maestros', async () => {
    const { responder, examen, actores } = await escenarioConExamen();
    await expect(
      responder.ejecutar(examen.id, [0, 1], actores.intruso),
    ).rejects.toThrow(SinPermisoError);
    await expect(
      responder.ejecutar(examen.id, [0, 1], actores.maestra),
    ).rejects.toThrow(SinPermisoError);
  });
});

describe('ObtenerExamenDeSemana', () => {
  it('nunca envía la respuesta correcta al alumno y le muestra su resultado', async () => {
    const { acceso, examenes, intentos, materia, responder, examen, actores } =
      await escenarioConExamen();
    const consultar = new ObtenerExamenDeSemana(acceso, examenes, intentos);

    const antes = presentarExamen(
      await consultar.ejecutar(materia.id, 3, actores.alumno),
    );
    expect(antes.preguntas.every((p) => !('respuestaCorrecta' in p))).toBe(
      true,
    );
    expect(antes.miIntento).toBeNull();

    await responder.ejecutar(examen.id, [0, 1], actores.alumno);
    const despues = presentarExamen(
      await consultar.ejecutar(materia.id, 3, actores.alumno),
    );
    expect(despues.miIntento?.calificacion).toBe(100);

    const maestra = presentarExamen(
      await consultar.ejecutar(materia.id, 3, actores.maestra),
    );
    expect(maestra.preguntas[0]).toHaveProperty('respuestaCorrecta', 0);
    expect(maestra).not.toHaveProperty('miIntento');
  });
});

describe('ActualizarExamen', () => {
  it('bloquea cambiar preguntas cuando ya hay respuestas, pero permite cambiar el título', async () => {
    const { acceso, examenes, intentos, responder, examen, actores } =
      await escenarioConExamen();
    await responder.ejecutar(examen.id, [0, 1], actores.alumno);
    const actualizar = new ActualizarExamen(acceso, examenes, intentos);

    await expect(
      actualizar.ejecutar(
        examen.id,
        { preguntas: preguntasDeEjemplo() },
        actores.maestra,
      ),
    ).rejects.toThrow(ConflictoError);
    await expect(
      actualizar.ejecutar(examen.id, { titulo: 'v2' }, actores.maestra),
    ).resolves.toMatchObject({
      titulo: 'v2',
    });
  });
});

describe('ListarIntentos', () => {
  it('la maestra ve todos los resultados con el nombre del alumno; el alumno solo el suyo', async () => {
    const { acceso, examenes, intentos, usuarios, responder, examen, actores } =
      await escenarioConExamen();
    await responder.ejecutar(examen.id, [0, 1], actores.alumno);
    const listar = new ListarIntentos(acceso, examenes, intentos, usuarios);

    const deLaMaestra = await listar.ejecutar(examen.id, actores.maestra);
    expect(deLaMaestra.map((r) => r.alumno?.nombre)).toEqual(['Luis']);
    await expect(listar.ejecutar(examen.id, actores.intruso)).rejects.toThrow(
      SinPermisoError,
    );
  });
});
