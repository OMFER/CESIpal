import { Usuario } from '../../usuarios/domain/usuario';
import { UsuarioRepository } from '../../usuarios/domain/usuario.repository';
import { Materia } from '../domain/materia';
import {
  calcularSemanaActual,
  generarSemanas,
  SemanaCalendario,
} from '../domain/calendario';

export interface MateriaConMaestro {
  materia: Materia;
  maestro: Usuario | null;
}

export interface MateriaConCalendario extends MateriaConMaestro {
  semanaActual: number;
  semanas: SemanaCalendario[];
}

export async function conMaestros(
  materias: Materia[],
  usuarios: UsuarioRepository,
): Promise<MateriaConMaestro[]> {
  const maestros = await usuarios.buscarPorIds([
    ...new Set(materias.map((m) => m.maestroId)),
  ]);
  return materias.map((materia) => ({
    materia,
    maestro: maestros.find((u) => u.id === materia.maestroId) ?? null,
  }));
}

export function conCalendario(
  vista: MateriaConMaestro,
  hoy: Date,
): MateriaConCalendario {
  const { fechaInicio, totalSemanas } = vista.materia;
  return {
    ...vista,
    semanaActual: calcularSemanaActual(fechaInicio, totalSemanas, hoy),
    semanas: generarSemanas(fechaInicio, totalSemanas, hoy),
  };
}
