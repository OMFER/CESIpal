import { Materia } from '../../planes/domain/materia';
import {
  EXAMENES_POR_SEMANA,
  SEMANAS_POR_MATERIA,
} from '../../planes/domain/plan';
import { numeroDeBloques } from '../../planes/domain/calendario';

export interface ContenidoDeMateria {
  materia: Materia;
  // Semanas de la materia que ya tienen infografía
  semanasConContenido: number[];
  // Exámenes que ya existen, por semana y número
  examenes: { semana: number; numero: number }[];
}

/**
 * Lo que le falta a un plan para poder publicarse. Un grupo solo puede abrirse con un plan
 * completo: cada bloque con materias y cada materia con su contenido y sus dos exámenes por semana.
 */
export function pendientesParaPublicar(
  contenidos: ContenidoDeMateria[],
): string[] {
  if (contenidos.length === 0) {
    return ['El plan no tiene materias'];
  }
  const pendientes: string[] = [];
  const bloques = numeroDeBloques(contenidos.map((c) => c.materia));
  for (let bloque = 1; bloque <= bloques; bloque++) {
    if (!contenidos.some((c) => c.materia.bloque === bloque)) {
      pendientes.push(`El bloque ${bloque} no tiene materias`);
    }
  }

  for (const { materia, semanasConContenido, examenes } of contenidos) {
    if (!materia.maestroId) {
      pendientes.push(`${materia.nombre}: no tiene maestro asignado`);
    }
    for (let semana = 1; semana <= SEMANAS_POR_MATERIA; semana++) {
      if (!semanasConContenido.includes(semana)) {
        pendientes.push(
          `${materia.nombre}: falta el contenido de la semana ${semana}`,
        );
      }
      for (let numero = 1; numero <= EXAMENES_POR_SEMANA; numero++) {
        if (!examenes.some((e) => e.semana === semana && e.numero === numero)) {
          pendientes.push(
            `${materia.nombre}: falta el examen ${numero} de la semana ${semana}`,
          );
        }
      }
    }
  }
  return pendientes;
}
