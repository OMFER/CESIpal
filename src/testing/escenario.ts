import { Rol } from '../shared/domain/actor';
import { AccesoMaterias } from '../modules/materias/application/acceso-materias';
import {
  actorDe,
  ExamenesEnMemoria,
  InscripcionesEnMemoria,
  IntentosEnMemoria,
  MateriasEnMemoria,
  RelojFijo,
  UsuariosEnMemoria,
} from './en-memoria';

const DIA = 24 * 60 * 60 * 1000;

// Una materia de 16 semanas que empezó hace 15 días (va en la semana 3), su maestra y dos alumnos
export async function crearEscenario() {
  const hoy = new Date('2026-10-30T12:00:00Z');
  const reloj = new RelojFijo(hoy);
  const usuarios = new UsuariosEnMemoria();
  const materias = new MateriasEnMemoria();
  const inscripciones = new InscripcionesEnMemoria(usuarios);
  const examenes = new ExamenesEnMemoria();
  const intentos = new IntentosEnMemoria(reloj);
  const acceso = new AccesoMaterias(materias, inscripciones);

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
    maestroId: maestra.id,
    fechaInicio: new Date(hoy.getTime() - 15 * DIA),
    totalSemanas: 16,
  });
  await inscripciones.inscribir([alumno.id], materia.id);

  return {
    hoy,
    reloj,
    usuarios,
    materias,
    inscripciones,
    examenes,
    intentos,
    acceso,
    materia,
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
