import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { aObjectId } from '../../../shared/infrastructure/mongo/object-id';
import { Clase } from '../domain/clase';
import {
  CambiosClase,
  ClaseRepository,
  DatosClase,
} from '../domain/clase.repository';
import { ClaseModelo } from './clase.schema';

type ClasePlana = Omit<ClaseModelo, 'materia'> & {
  _id: Types.ObjectId;
  materia: Types.ObjectId;
};

function aClase(doc: ClasePlana): Clase {
  return {
    id: doc._id.toString(),
    materiaId: doc.materia.toString(),
    semana: doc.semana,
    tema: doc.tema,
    introduccion: doc.introduccion,
    recursos: doc.recursos.map(({ tipo, titulo, url, descripcion }) => ({
      tipo,
      titulo,
      url,
      descripcion,
    })),
    fechaEnVivo: doc.fechaEnVivo,
    links: doc.links,
  };
}

@Injectable()
export class MongoClaseRepository implements ClaseRepository {
  constructor(
    @InjectModel(ClaseModelo.name) private readonly modelo: Model<ClaseModelo>,
  ) {}

  async crear({ materiaId, ...datos }: DatosClase): Promise<Clase> {
    const doc = await this.modelo.create({
      ...datos,
      materia: aObjectId(materiaId),
    });
    return aClase(doc.toObject<ClasePlana>());
  }

  async actualizar(id: string, cambios: CambiosClase): Promise<Clase | null> {
    const doc = await this.modelo
      .findByIdAndUpdate(id, cambios, { new: true })
      .lean<ClasePlana>()
      .exec();
    return doc ? aClase(doc) : null;
  }

  async eliminar(id: string): Promise<void> {
    await this.modelo.findByIdAndDelete(id).exec();
  }

  async buscarPorId(id: string): Promise<Clase | null> {
    const doc = await this.modelo.findById(id).lean<ClasePlana>().exec();
    return doc ? aClase(doc) : null;
  }

  async buscarPorSemana(
    materiaId: string,
    semana: number,
  ): Promise<Clase | null> {
    const doc = await this.modelo
      .findOne({ materia: aObjectId(materiaId), semana })
      .lean<ClasePlana>()
      .exec();
    return doc ? aClase(doc) : null;
  }

  async listarPorMateria(materiaId: string): Promise<Clase[]> {
    const docs = await this.modelo
      .find({ materia: aObjectId(materiaId) })
      .sort({ semana: 1 })
      .lean<ClasePlana[]>()
      .exec();
    return docs.map(aClase);
  }
}
