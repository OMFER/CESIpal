import { presentarUsuarioResumen } from '../../usuarios/presentation/usuario.presenter';
import { Examen, Pregunta } from '../domain/examen';
import { Intento } from '../domain/intento';
import { Nota } from '../domain/boleta';
import { PreguntaRevisada } from '../domain/calificar';
import {
  ExamenEnGrupo,
  ExamenesDeSemana,
  ResultadoDeIntento,
  ResumenExamen,
} from '../application/examenes-de-grupo';
import {
  BoletaDeAlumno,
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

const presentarRevision = (revisadas: PreguntaRevisada[]) =>
  revisadas.map((p) => ({
    ...presentarPregunta(p),
    miRespuesta: p.miRespuesta,
    acierto: p.acierto,
  }));

// Plantilla completa para quien edita la materia
export function presentarExamen(examen: Examen) {
  return {
    _id: examen.id,
    materia: examen.materiaId,
    tipo: examen.tipo,
    semana: examen.semana,
    titulo: examen.titulo,
    descripcion: examen.descripcion,
    puntajeMaximo: examen.puntajeMaximo,
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
  ventana,
  miIntento,
}: ResumenExamen) {
  return {
    _id: examen.id,
    tipo: examen.tipo,
    semana: examen.semana,
    titulo: examen.titulo,
    descripcion: examen.descripcion,
    puntajeMaximo: examen.puntajeMaximo,
    totalPreguntas: examen.preguntas.length,
    ventana,
    ...(miIntento !== undefined && {
      miIntento: presentarResumenIntento(miIntento),
    }),
  };
}

export function presentarExamenesDeSemana({
  semanal,
  reposicion,
}: ExamenesDeSemana) {
  return {
    semanal: semanal && presentarResumenExamen(semanal),
    reposicion: reposicion && presentarResumenExamen(reposicion),
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
}: ResultadoDeIntento) {
  return {
    ...presentarResumenIntento(intento),
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

const presentarNota = (nota: Nota | null) =>
  nota && {
    calificacion: nota.calificacion,
    puntajeMaximo: nota.puntajeMaximo,
  };

export function presentarBoleta({ alumno, semanas, final }: BoletaDeAlumno) {
  return {
    alumno: presentarUsuarioResumen(alumno),
    semanas: semanas.map((s) => ({
      semana: s.semana,
      semanal: presentarNota(s.semanal),
      reposicion: presentarNota(s.reposicion),
      mejor: presentarNota(s.mejor),
    })),
    final: presentarNota(final),
  };
}
