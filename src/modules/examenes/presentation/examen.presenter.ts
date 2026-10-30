import { presentarUsuarioResumen } from '../../usuarios/presentation/usuario.presenter';
import { Examen } from '../domain/examen';
import { Intento } from '../domain/intento';
import { VistaExamen } from '../application/consultar-examenes';
import { IntentoConAlumno } from '../application/responder-examen';

export function presentarResumenIntento(intento: Intento | null) {
  if (!intento) return null;
  const { aciertos, totalPreguntas, calificacion, fecha } = intento;
  return { aciertos, totalPreguntas, calificacion, fecha };
}

function datosGenerales(examen: Examen) {
  return {
    _id: examen.id,
    materia: examen.materiaId,
    semana: examen.semana,
    titulo: examen.titulo,
    descripcion: examen.descripcion,
    tipo: examen.tipo,
    fechaLimite: examen.fechaLimite,
    puntajeMaximo: examen.puntajeMaximo,
  };
}

function conIntento(vista: VistaExamen) {
  return vista.miIntento === undefined
    ? {}
    : { miIntento: presentarResumenIntento(vista.miIntento) };
}

export function presentarExamen(vista: VistaExamen) {
  const { examen, conRespuestas } = vista;
  return {
    ...datosGenerales(examen),
    preguntas: examen.preguntas.map(
      ({ id, enunciado, opciones, respuestaCorrecta }) =>
        conRespuestas
          ? { _id: id, enunciado, opciones, respuestaCorrecta }
          : { _id: id, enunciado, opciones },
    ),
    ...conIntento(vista),
  };
}

// En la lista, el alumno no recibe las preguntas: solo cuántas son y su resultado
export function presentarExamenEnLista(vista: VistaExamen) {
  if (vista.conRespuestas) return presentarExamen(vista);
  return {
    ...datosGenerales(vista.examen),
    totalPreguntas: vista.examen.preguntas.length,
    ...conIntento(vista),
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
