import {
  NoEncontradoError,
  SinPermisoError,
} from '../../../shared/domain/errores';
import { crearEscenario } from '../../../testing/escenario';
import { ObtenerMisMaterias } from './consultar-calendario';

describe('AccesoMaterias', () => {
  it('deja leer al admin, a la maestra de la materia y al alumno inscrito', async () => {
    const { acceso, materia, actores } = await crearEscenario();
    for (const actor of [actores.admin, actores.maestra, actores.alumno]) {
      await expect(acceso.paraLeer(materia.id, actor)).resolves.toEqual(
        materia,
      );
    }
  });

  it('rechaza al alumno no inscrito y a la maestra de otra materia', async () => {
    const { acceso, materia, actores } = await crearEscenario();
    await expect(acceso.paraLeer(materia.id, actores.intruso)).rejects.toThrow(
      SinPermisoError,
    );
    await expect(
      acceso.paraLeer(materia.id, actores.otraMaestra),
    ).rejects.toThrow(SinPermisoError);
  });

  it('solo deja editar a la maestra de la materia y al admin', async () => {
    const { acceso, materia, actores } = await crearEscenario();
    await expect(
      acceso.paraEditar(materia.id, actores.maestra),
    ).resolves.toEqual(materia);
    await expect(acceso.paraEditar(materia.id, actores.admin)).resolves.toEqual(
      materia,
    );
    await expect(acceso.paraEditar(materia.id, actores.alumno)).rejects.toThrow(
      SinPermisoError,
    );
    await expect(
      acceso.paraEditar(materia.id, actores.otraMaestra),
    ).rejects.toThrow(SinPermisoError);
  });

  it('da 404 si la materia no existe', async () => {
    const { acceso, actores } = await crearEscenario();
    await expect(
      acceso.paraLeer('f'.repeat(24), actores.admin),
    ).rejects.toThrow(NoEncontradoError);
  });
});

describe('ObtenerMisMaterias', () => {
  it('muestra a cada actor solo sus materias, con la semana actual del semestre', async () => {
    const { materias, inscripciones, usuarios, reloj, actores } =
      await crearEscenario();
    const caso = new ObtenerMisMaterias(
      materias,
      inscripciones,
      usuarios,
      reloj,
    );

    const delAlumno = await caso.ejecutar(actores.alumno);
    expect(delAlumno).toHaveLength(1);
    expect(delAlumno[0].semanaActual).toBe(3);
    expect(delAlumno[0].maestro?.nombre).toBe('Ana');
    expect(delAlumno[0].semanas.map((s) => s.estado).slice(0, 4)).toEqual([
      'completada',
      'completada',
      'actual',
      'futura',
    ]);

    expect(await caso.ejecutar(actores.intruso)).toHaveLength(0);
    expect(await caso.ejecutar(actores.maestra)).toHaveLength(1);
    expect(await caso.ejecutar(actores.otraMaestra)).toHaveLength(0);
  });
});
