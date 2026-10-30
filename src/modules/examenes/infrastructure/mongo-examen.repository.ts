import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { aObjectId } from '../../../shared/infrastructure/mongo/object-id';
import { Examen } from '../domain/examen';
import {
  CambiosExamen,
  DatosExamen,
  ExamenRepository,
} from '../domain/examen.repository';
import { ExamenModelo, PreguntaModelo } from './examen.schema';

type ExamenPlano = Omit<ExamenModelo, 'materia' | 'preguntas'> & {
  _id: Types.ObjectId;
  materia: Types.ObjectId;
  preguntas: (PreguntaModelo & { _id: Types.ObjectId })[];
};

function aExamen(doc: ExamenPlano): Examen {
  return {
    id: doc._id.toString(),
    materiaId: doc.materia.toString(),
    semana: doc.semana,
    titulo: doc.titulo,
    descripcion: doc.descripcion,
    tipo: doc.tipo,
    fechaLimite: doc.fechaLimite,
    puntajeMaximo: doc.puntajeMaximo,
    preguntas: doc.preguntas.map(
      ({ _id, enunciado, opciones, respuestaCorrecta }) => ({
        id: _id.toString(),
        enunciado,
        opciones,
        respuestaCorrecta,
      }),
    ),
  };
}

// El id de cada pregunta lo asigna Mongo; no se reenvía al guardar
const sinIdsDePregunta = <T extends { preguntas?: Examen['preguntas'] }>(
  datos: T,
) =>
  datos.preguntas
    ? {
        ...datos,
        preguntas: datos.preguntas.map(
          ({ enunciado, opciones, respuestaCorrecta }) => ({
            enunciado,
            opciones,
            respuestaCorrecta,
          }),
        ),
      }
    : datos;

@Injectable()
export class MongoExamenRepository implements ExamenRepository {
  constructor(
    @InjectModel(ExamenModelo.name)
    private readonly modelo: Model<ExamenModelo>,
  ) {}

  async crear({ materiaId, ...datos }: DatosExamen): Promise<Examen> {
    const doc = await this.modelo.create({
      ...sinIdsDePregunta(datos),
      materia: aObjectId(materiaId),
    });
    return aExamen(doc.toObject<ExamenPlano>());
  }

  async actualizar(id: string, cambios: CambiosExamen): Promise<Examen | null> {
    const doc = await this.modelo
      .findByIdAndUpdate(id, sinIdsDePregunta(cambios), { new: true })
      .lean<ExamenPlano>()
      .exec();
    return doc ? aExamen(doc) : null;
  }

  async eliminar(id: string): Promise<void> {
    await this.modelo.findByIdAndDelete(id).exec();
  }

  async buscarPorId(id: string): Promise<Examen | null> {
    const doc = await this.modelo.findById(id).lean<ExamenPlano>().exec();
    return doc ? aExamen(doc) : null;
  }

  async buscarPorSemana(
    materiaId: string,
    semana: number,
  ): Promise<Examen | null> {
    const doc = await this.modelo
      .findOne({ materia: aObjectId(materiaId), semana })
      .lean<ExamenPlano>()
      .exec();
    return doc ? aExamen(doc) : null;
  }

  async listarPorMateria(materiaId: string): Promise<Examen[]> {
    const docs = await this.modelo
      .find({ materia: aObjectId(materiaId) })
      .sort({ semana: 1, createdAt: 1 })
      .lean<ExamenPlano[]>()
      .exec();
    return docs.map(aExamen);
  }
}
