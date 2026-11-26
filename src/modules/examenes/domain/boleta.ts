import {
  EXAMENES_POR_SEMANA,
  SEMANAS_POR_MATERIA,
} from '../../planes/domain/plan';
import { Examen } from './examen';
import { Intento } from './intento';

export const CALIFICACION_APROBATORIA = 6;

export interface NotaDeExamen {
  semana: number;
  numero: number;
  // null si el alumno no lo presentó
  calificacion: number | null;
}

export interface BoletaDeMateria {
  materiaId: string;
  // Siempre las cuatro: semana 1 (examen 1 y 2) y semana 2 (examen 1 y 2)
  notas: NotaDeExamen[];
  // Promedio de las cuatro sobre 10; lo que no se presentó cuenta 0
  promedio: number;
  aprobada: boolean;
  // Ya presentó todos los exámenes de la materia
  completa: boolean;
}

export interface Boleta {
  materias: BoletaDeMateria[];
  // Promedio de los promedios de las materias
  promedioGeneral: number;
}

const redondear = (n: number) => Math.round(n * 10) / 10;

const promedio = (valores: number[]) =>
  valores.length === 0
    ? 0
    : valores.reduce((suma, v) => suma + v, 0) / valores.length;

export function construirBoletaDeMateria(
  materiaId: string,
  examenesDeMateria: Examen[],
  intentosDelAlumno: Intento[],
): BoletaDeMateria {
  const notas: NotaDeExamen[] = [];
  for (let semana = 1; semana <= SEMANAS_POR_MATERIA; semana++) {
    for (let numero = 1; numero <= EXAMENES_POR_SEMANA; numero++) {
      const examen = examenesDeMateria.find(
        (e) => e.semana === semana && e.numero === numero,
      );
      const intento =
        examen && intentosDelAlumno.find((i) => i.examenId === examen.id);
      notas.push({
        semana,
        numero,
        calificacion: intento?.calificacion ?? null,
      });
    }
  }
  const valor = redondear(promedio(notas.map((n) => n.calificacion ?? 0)));
  return {
    materiaId,
    notas,
    promedio: valor,
    aprobada: valor >= CALIFICACION_APROBATORIA,
    completa: notas.every((n) => n.calificacion !== null),
  };
}

// Calificaciones de un alumno en su grupo: una boleta por cada materia del plan, en orden
export function construirBoleta(
  materiaIds: string[],
  examenes: Examen[],
  intentosDelAlumno: Intento[],
): Boleta {
  const materias = materiaIds.map((id) =>
    construirBoletaDeMateria(
      id,
      examenes.filter((e) => e.materiaId === id),
      intentosDelAlumno,
    ),
  );
  return {
    materias,
    promedioGeneral: redondear(promedio(materias.map((m) => m.promedio))),
  };
}
