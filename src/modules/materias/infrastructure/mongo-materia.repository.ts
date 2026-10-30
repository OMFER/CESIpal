import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { aObjectIds } from '../../../shared/infrastructure/mongo/object-id';
import { Materia } from '../domain/materia';
import { DatosMateria, MateriaRepository } from '../domain/materia.repository';
import { MateriaModelo } from './materia.schema';

type MateriaPlana = MateriaModelo & { _id: Types.ObjectId };

function aMateria(doc: MateriaPlana): Materia {
  return {
    id: doc._id.toString(),
    nombre: doc.nombre,
    descripcion: doc.descripcion,
    totalSemanas: doc.totalSemanas,
  };
}

@Injectable()
export class MongoMateriaRepository implements MateriaRepository {
  constructor(
    @InjectModel(MateriaModelo.name)
    private readonly modelo: Model<MateriaModelo>,
  ) {}

  async crear(datos: DatosMateria): Promise<Materia> {
    const doc = await this.modelo.create(datos);
    return aMateria(doc.toObject<MateriaPlana>());
  }

  async actualizar(
    id: string,
    cambios: Partial<DatosMateria>,
  ): Promise<Materia | null> {
    const doc = await this.modelo
      .findByIdAndUpdate(id, cambios, { new: true })
      .lean<MateriaPlana>()
      .exec();
    return doc ? aMateria(doc) : null;
  }

  async eliminar(id: string): Promise<void> {
    await this.modelo.findByIdAndDelete(id).exec();
  }

  async buscarPorId(id: string): Promise<Materia | null> {
    const doc = await this.modelo.findById(id).lean<MateriaPlana>().exec();
    return doc ? aMateria(doc) : null;
  }

  async buscarPorIds(ids: string[]): Promise<Materia[]> {
    const docs = await this.modelo
      .find({ _id: { $in: aObjectIds(ids) } })
      .lean<MateriaPlana[]>()
      .exec();
    return docs.map(aMateria);
  }

  async listar(): Promise<Materia[]> {
    const docs = await this.modelo
      .find()
      .sort({ nombre: 1 })
      .lean<MateriaPlana[]>()
      .exec();
    return docs.map(aMateria);
  }
}
