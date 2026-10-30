import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { aObjectId } from '../../../shared/infrastructure/mongo/object-id';
import { Examen, TipoExamen } from '../domain/examen';
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
    tipo: doc.tipo,
    semana: doc.semana,
    titulo: doc.titulo,
    descripcion: doc.descripcion,
    puntajeMaximo: doc.puntajeMaximo,
    diasExtra: doc.diasExtra ?? 0,
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

  async buscarEnMateria(
    materiaId: string,
    tipo: TipoExamen,
    semana?: number,
  ): Promise<Examen | null> {
    const doc = await this.modelo
      .findOne({
        materia: aObjectId(materiaId),
        tipo,
        semana: semana ?? { $exists: false },
      })
      .lean<ExamenPlano>()
      .exec();
    return doc ? aExamen(doc) : null;
  }

  async listarPorMateria(materiaId: string): Promise<Examen[]> {
    const docs = await this.modelo
      .find({ materia: aObjectId(materiaId) })
      .sort({ semana: 1, tipo: -1 })
      .lean<ExamenPlano[]>()
      .exec();
    return docs.map(aExamen);
  }

  async eliminarDeMateria(materiaId: string): Promise<void> {
    await this.modelo.deleteMany({ materia: aObjectId(materiaId) });
  }
}
