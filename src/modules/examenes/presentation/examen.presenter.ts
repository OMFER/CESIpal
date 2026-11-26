import { presentarUsuarioResumen } from '../../usuarios/presentation/usuario.presenter';
import { Examen, Pregunta } from '../domain/examen';
import { Intento } from '../domain/intento';
import { PreguntaRevisada } from '../domain/calificar';
import {
  ExamenEnGrupo,
  ResultadoDeIntento,
  ResumenExamen,
} from '../application/examenes-de-grupo';
import {
  BoletaDeAlumno,
  CalificacionesDeGrupo,
  IntentoConAlumno,
} from '../application/resultados-de-grupo';

const presentarPregunta = ({
  id,
  enunciado,
  opciones,
  respuestaCorrecta,
}: Pregunta) => ({ _id: id, enunciado, opciones, respuestaCorrecta });

const presentarPreguntaSinRespuesta = ({
  id,
  enunciado,
  opciones,
}: Pregunta) => ({
  _id: id,
  enunciado,
  opciones,
});

// respuestaCorrecta solo viene cuando el examen ya cerró en el grupo
const presentarRevision = (revisadas: PreguntaRevisada[]) =>
  revisadas.map((p) => ({
    _id: p.id,
    enunciado: p.enunciado,
    opciones: p.opciones,
    ...(p.respuestaCorrecta !== undefined && {
      respuestaCorrecta: p.respuestaCorrecta,
    }),
    miRespuesta: p.miRespuesta,
    acierto: p.acierto,
  }));

// Plantilla completa para quien edita la materia
export function presentarExamen(examen: Examen) {
  return {
    _id: examen.id,
    materia: examen.materiaId,
    semana: examen.semana,
    numero: examen.numero,
    titulo: examen.titulo,
    descripcion: examen.descripcion,
    diasExtra: examen.diasExtra,
    preguntas: examen.preguntas.map(presentarPregunta),
  };
}

export function presentarResumenIntento(intento: Intento | null) {
  if (!intento) return null;
  const { aciertos, totalPreguntas, calificacion, fecha } = intento;
  return { aciertos, totalPreguntas, calificacion, fecha };
}

export function presentarResumenExamen({
  examen,
  materia,
  semanaDelGrupo,
  ventana,
  miIntento,
}: ResumenExamen) {
  return {
    _id: examen.id,
    materia: { _id: materia.id, nombre: materia.nombre },
    semana: examen.semana,
    numero: examen.numero,
    semanaDelGrupo,
    titulo: examen.titulo,
    descripcion: examen.descripcion,
    totalPreguntas: examen.preguntas.length,
    ventana,
    ...(miIntento !== undefined && {
      miIntento: presentarResumenIntento(miIntento),
    }),
  };
}

export function presentarExamenEnGrupo(vista: ExamenEnGrupo) {
  const { examen } = vista;
  const visibles = vista.preguntas;
  const preguntas =
    visibles.modo === 'conRespuestas'
      ? examen.preguntas.map(presentarPregunta)
      : visibles.modo === 'sinRespuestas'
        ? examen.preguntas.map(presentarPreguntaSinRespuesta)
        : visibles.modo === 'revision'
          ? presentarRevision(visibles.preguntas)
          : [];
  return { ...presentarResumenExamen(vista), preguntas };
}

export function presentarResultadoDeIntento({
  intento,
  revision,
  ventana,
}: ResultadoDeIntento) {
  return {
    ...presentarResumenIntento(intento),
    // Las respuestas correctas se muestran a partir de ventana.cierra
    ventana,
    revision: presentarRevision(revision),
  };
}

export function presentarIntento({ intento, alumno }: IntentoConAlumno) {
  return {
    _id: intento.id,
    examen: intento.examenId,
    alumno: alumno
      ? presentarUsuarioResumen(alumno)
      : { _id: intento.alumnoId },
    respuestas: intento.respuestas,
    aciertos: intento.aciertos,
    totalPreguntas: intento.totalPreguntas,
    calificacion: intento.calificacion,
    createdAt: intento.fecha,
  };
}

const presentarBoleta = ({
  alumno,
  materias,
  promedioGeneral,
}: BoletaDeAlumno) => ({
  alumno: presentarUsuarioResumen(alumno),
  materias: materias.map((m) => ({
    materia: m.materiaId,
    notas: m.notas,
    promedio: m.promedio,
    aprobada: m.aprobada,
    completa: m.completa,
  })),
  promedioGeneral,
});

export const presentarCalificaciones = ({
  materias,
  boletas,
}: CalificacionesDeGrupo) => ({
  materias: materias.map((m) => ({
    _id: m.id,
    nombre: m.nombre,
    bloque: m.bloque,
  })),
  boletas: boletas.map(presentarBoleta),
});
