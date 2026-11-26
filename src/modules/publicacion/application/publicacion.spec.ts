import {
  ConflictoError,
  DatosInvalidosError,
} from '../../../shared/domain/errores';
import { crearEscenario } from '../../../testing/escenario';
import { EstadoPlan } from '../../planes/domain/plan';
import { CrearNuevaVersion, PublicarPlan, RevisarPlan } from './publicacion';

async function preparar() {
  const e = await crearEscenario();
  const completo = [e.planes, e.materias, e.clases, e.examenes] as const;
  return {
    ...e,
    revisar: new RevisarPlan(...completo),
    publicar: new PublicarPlan(...completo, e.bitacora, e.reloj),
    nuevaVersion: new CrearNuevaVersion(...completo, e.bitacora),
  };
}

describe('publicar un plan', () => {
  it('no publica un plan incompleto y dice qué le falta', async () => {
    const e = await preparar();
    const plan = await e.planes.crear({
      nombre: 'Nuevo',
      version: 1,
      estado: EstadoPlan.BORRADOR,
    });
    await e.materias.crear({ planId: plan.id, nombre: 'Física', bloque: 1 });

    const pendientes = await e.revisar.ejecutar(plan.id);
    expect(pendientes).toContain('Física: no tiene maestro asignado');
    expect(pendientes).toContain('Física: falta el examen 2 de la semana 2');
    const intento = e.publicar.ejecutar(plan.id, e.actores.admin);
    await expect(intento).rejects.toThrow(DatosInvalidosError);
    await expect(intento).rejects.toMatchObject({ detalles: pendientes });
  });

  it('publica un plan completo y no lo vuelve a publicar', async () => {
    const e = await preparar();
    const plan = await e.planes.crear({
      nombre: 'Nuevo',
      version: 1,
      estado: EstadoPlan.BORRADOR,
    });
    const materia = await e.materias.crear({
      planId: plan.id,
      nombre: 'Física',
      bloque: 1,
      maestroId: e.actores.ana.id,
    });
    await e.completar(materia.id);

    const publicado = await e.publicar.ejecutar(plan.id, e.actores.admin);
    expect(publicado).toMatchObject({
      estado: EstadoPlan.PUBLICADO,
      publicadoEn: e.hoy,
    });
    await expect(e.publicar.ejecutar(plan.id, e.actores.admin)).rejects.toThrow(
      ConflictoError,
    );
  });
});

describe('nueva versión', () => {
  it('copia materias, contenido y exámenes a un borrador con el siguiente número', async () => {
    const e = await preparar();
    const v2 = await e.nuevaVersion.ejecutar(e.plan.id, e.actores.admin);
    expect(v2).toMatchObject({
      nombre: 'Prepa intensiva',
      version: 2,
      estado: EstadoPlan.BORRADOR,
    });

    const materias = await e.materias.listarPorPlan(v2.id);
    expect(materias.map((m) => [m.nombre, m.bloque, m.maestroId])).toEqual([
      ['Historia', 1, e.actores.berta.id],
      ['Matemáticas', 1, e.actores.ana.id],
      ['Química', 2, e.actores.ana.id],
    ]);
    const copiaDeMate = materias[1];
    expect(copiaDeMate.id).not.toBe(e.matematicas.id);
    expect(await e.clases.listarPorMateria(copiaDeMate.id)).toHaveLength(2);
    const examenes = await e.examenes.listarPorMateria(copiaDeMate.id);
    expect(examenes).toHaveLength(4);
    expect(examenes[0].preguntas[0]).not.toHaveProperty('id');
    // Ya está completa: se puede publicar tal cual
    expect(await e.revisar.ejecutar(v2.id)).toEqual([]);

    // La versión original queda intacta para los grupos que la usan
    expect(await e.examenes.listarPorMateria(e.matematicas.id)).toHaveLength(4);
    const v3 = await e.nuevaVersion.ejecutar(e.plan.id, e.actores.admin);
    expect(v3.version).toBe(3);
  });
});
