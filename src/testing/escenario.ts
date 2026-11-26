import { Rol } from '../shared/domain/actor';
import { BusDeEventosEnMemoria } from '../shared/infrastructure/bus-de-eventos';
import { EstadoPlan } from '../modules/planes/domain/plan';
import {
  AccesoGrupos,
  AccesoMaterias,
} from '../modules/planes/application/acceso';
import { LimpiezaDeExamenes } from '../modules/examenes/application/limpieza';
import { BorrarContenidoAlEliminarMateria } from '../modules/clases/application/al-eliminar-materia';
import {
  actorDe,
  BitacoraEnMemoria,
  ClasesEnMemoria,
  ExamenesEnMemoria,
  GruposEnMemoria,
  InscripcionesEnMemoria,
  IntentosEnMemoria,
  MateriasEnMemoria,
  PlanesEnMemoria,
  RelojFijo,
  UsuariosEnMemoria,
} from './en-memoria';

const DIA = 24 * 60 * 60 * 1000;

export const preguntasDeEjemplo = () => [
  {
    enunciado: '¿Cuánto es 2 + 2?',
    opciones: ['3', '4', '5'],
    respuestaCorrecta: 1,
  },
  {
    enunciado: '¿Cuál es un número primo?',
    opciones: ['7', '8'],
    respuestaCorrecta: 0,
  },
];

/**
 * Un plan publicado de dos bloques: Matemáticas e Historia (bloque 1) y Química (bloque 2),
 * cada una con su contenido y sus cuatro exámenes. Un grupo lo cursa desde el lunes 19 de
 * octubre de 2026: "hoy" es el viernes 30 (12:00 UTC), semana 2 del grupo, así que los
 * exámenes de la semana 1 ya cerraron y los dos de la semana 2 están abiertos.
 * Ana tiene Matemáticas y Química; Berta, Historia. Luis está inscrito; Otro no.
 */
export async function crearEscenario() {
  const hoy = new Date('2026-10-30T12:00:00Z');
  const reloj = new RelojFijo(hoy);
  const eventos = new BusDeEventosEnMemoria();
  const usuarios = new UsuariosEnMemoria();
  const planes = new PlanesEnMemoria();
  const materias = new MateriasEnMemoria();
  const grupos = new GruposEnMemoria();
  const inscripciones = new InscripcionesEnMemoria(usuarios);
  const clases = new ClasesEnMemoria();
  const examenes = new ExamenesEnMemoria();
  const intentos = new IntentosEnMemoria(reloj);
  const bitacora = new BitacoraEnMemoria(reloj);
  const accesoMaterias = new AccesoMaterias(
    materias,
    planes,
    grupos,
    inscripciones,
  );
  const accesoGrupos = new AccesoGrupos(
    grupos,
    planes,
    materias,
    inscripciones,
  );
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
  const ana = await nuevo('Ana', Rol.MAESTRO);
  const berta = await nuevo('Berta', Rol.MAESTRO);
  const alumno = await nuevo('Luis', Rol.ALUMNO);
  const intruso = await nuevo('Otro', Rol.ALUMNO);

  const plan = await planes.crear({
    nombre: 'Prepa intensiva',
    version: 1,
    estado: EstadoPlan.BORRADOR,
  });

  // Contenido de las dos semanas y sus cuatro exámenes
  const completar = async (materiaId: string) => {
    for (const semana of [1, 2]) {
      await clases.crear({
        materiaId,
        semana,
        tema: `Tema ${semana}`,
        recursos: [],
      });
      for (const numero of [1, 2]) {
        await examenes.crear({
          materiaId,
          semana,
          numero,
          titulo: `Semana ${semana} · Examen ${numero}`,
          diasExtra: 0,
          preguntas: preguntasDeEjemplo(),
        });
      }
    }
  };
  const nuevaMateria = async (
    nombre: string,
    bloque: number,
    maestroId: string,
  ) => {
    const materia = await materias.crear({
      planId: plan.id,
      nombre,
      bloque,
      maestroId,
    });
    await completar(materia.id);
    return materia;
  };
  const matematicas = await nuevaMateria('Matemáticas', 1, ana.id);
  const historia = await nuevaMateria('Historia', 1, berta.id);
  const quimica = await nuevaMateria('Química', 2, ana.id);
  const publicado = (await planes.actualizar(plan.id, {
    estado: EstadoPlan.PUBLICADO,
    publicadoEn: new Date(hoy.getTime() - 30 * DIA),
  }))!;

  const grupo = await grupos.crear({
    planId: plan.id,
    nombre: 'Generación enero',
    fechaInicio: new Date('2026-10-19T00:00:00Z'),
  });
  await inscripciones.inscribir([alumno.id], grupo.id);

  const examen = async (materiaId: string, semana: number, numero: number) =>
    (await examenes.buscarEnMateria(materiaId, semana, numero))!;

  return {
    hoy,
    reloj,
    eventos,
    usuarios,
    planes,
    materias,
    grupos,
    inscripciones,
    clases,
    examenes,
    intentos,
    bitacora,
    accesoMaterias,
    accesoGrupos,
    plan: publicado,
    matematicas,
    historia,
    quimica,
    grupo,
    completar,
    examen,
    actores: {
      admin: actorDe(admin),
      ana: actorDe(ana),
      berta: actorDe(berta),
      alumno: actorDe(alumno),
      intruso: actorDe(intruso),
    },
  };
}

export const DIAS = (n: number) => n * DIA;
