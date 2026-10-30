import { Rol } from '../shared/domain/actor';
import { BusDeEventosEnMemoria } from '../shared/infrastructure/bus-de-eventos';
import {
  AccesoGrupos,
  AccesoMaterias,
} from '../modules/materias/application/acceso';
import { LimpiezaDeExamenes } from '../modules/examenes/application/limpieza';
import { BorrarContenidoAlEliminarMateria } from '../modules/clases/application/al-eliminar-materia';
import {
  actorDe,
  ClasesEnMemoria,
  ExamenesEnMemoria,
  GruposEnMemoria,
  InscripcionesEnMemoria,
  IntentosEnMemoria,
  MateriasEnMemoria,
  RelojFijo,
  UsuariosEnMemoria,
} from './en-memoria';

const DIA = 24 * 60 * 60 * 1000;

/**
 * Una materia de 16 semanas con un grupo que empezó hace 15 días (va en la semana 3),
 * su maestra y dos alumnos: uno inscrito y otro no. "Hoy" es 2026-10-30 12:00 UTC.
 */
export async function crearEscenario() {
  const hoy = new Date('2026-10-30T12:00:00Z');
  const reloj = new RelojFijo(hoy);
  const eventos = new BusDeEventosEnMemoria();
  const usuarios = new UsuariosEnMemoria();
  const materias = new MateriasEnMemoria();
  const grupos = new GruposEnMemoria();
  const inscripciones = new InscripcionesEnMemoria(usuarios);
  const clases = new ClasesEnMemoria();
  const examenes = new ExamenesEnMemoria();
  const intentos = new IntentosEnMemoria(reloj);
  const accesoMaterias = new AccesoMaterias(materias, grupos, inscripciones);
  const accesoGrupos = new AccesoGrupos(grupos, materias, inscripciones);
  new LimpiezaDeExamenes(eventos, examenes, intentos).registrar();
  new BorrarContenidoAlEliminarMateria(eventos, clases).registrar();

  const nuevo = (nombre: string, rol: Rol) =>
    usuarios.crear({
      nombre,
      correo: `${nombre.toLowerCase()}@escuela.mx`,
      rol,
      passwordHash: 'x',
    });
  const admin = await nuevo('Admin', Rol.ADMIN);
  const maestra = await nuevo('Ana', Rol.MAESTRO);
  const otraMaestra = await nuevo('Berta', Rol.MAESTRO);
  const alumno = await nuevo('Luis', Rol.ALUMNO);
  const intruso = await nuevo('Otro', Rol.ALUMNO);

  const materia = await materias.crear({
    nombre: 'Creatividad',
    totalSemanas: 16,
  });
  const grupo = await grupos.crear({
    materiaId: materia.id,
    maestroId: maestra.id,
    nombre: 'Grupo 05',
    periodo: '2026-B',
    fechaInicio: new Date(hoy.getTime() - 15 * DIA),
  });
  await inscripciones.inscribir([alumno.id], grupo.id);

  return {
    hoy,
    reloj,
    eventos,
    usuarios,
    materias,
    grupos,
    inscripciones,
    clases,
    examenes,
    intentos,
    accesoMaterias,
    accesoGrupos,
    materia,
    grupo,
    actores: {
      admin: actorDe(admin),
      maestra: actorDe(maestra),
      otraMaestra: actorDe(otraMaestra),
      alumno: actorDe(alumno),
      intruso: actorDe(intruso),
    },
  };
}

export const preguntasDeEjemplo = () => [
  {
    enunciado: '¿Primera fase del design thinking?',
    opciones: ['Empatizar', 'Prototipar', 'Testear'],
    respuestaCorrecta: 0,
  },
  {
    enunciado: '¿Cuántas fases tiene?',
    opciones: ['3', '5', '7'],
    respuestaCorrecta: 1,
  },
];

export const DIAS = (n: number) => n * DIA;
