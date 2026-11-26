import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { aObjectId } from '../../../shared/infrastructure/mongo/object-id';
import { Materia } from '../domain/materia';
import {
  CambiosMateria,
  DatosMateria,
  MateriaRepository,
} from '../domain/materia.repository';
import { MateriaModelo } from './planes.schema';

type MateriaPlana = Omit<MateriaModelo, 'plan' | 'maestro'> & {
  _id: Types.ObjectId;
  plan: Types.ObjectId;
  maestro?: Types.ObjectId;
};

const aMateria = (doc: MateriaPlana): Materia => ({
  id: doc._id.toString(),
  planId: doc.plan.toString(),
  nombre: doc.nombre,
  descripcion: doc.descripcion,
  bloque: doc.bloque,
  maestroId: doc.maestro?.toString(),
});

@Injectable()
export class MongoMateriaRepository implements MateriaRepository {
  constructor(
    @InjectModel(MateriaModelo.name)
    private readonly modelo: Model<MateriaModelo>,
  ) {}

  async crear({ planId, maestroId, ...datos }: DatosMateria): Promise<Materia> {
    const doc = await this.modelo.create({
      ...datos,
      plan: aObjectId(planId),
      ...(maestroId && { maestro: aObjectId(maestroId) }),
    });
    return aMateria(doc.toObject<MateriaPlana>());
  }

  async actualizar(
    id: string,
    { maestroId, ...cambios }: CambiosMateria,
  ): Promise<Materia | null> {
    const doc = await this.modelo
      .findByIdAndUpdate(
        id,
        {
          $set: {
            ...cambios,
            ...(maestroId && { maestro: aObjectId(maestroId) }),
          },
          ...(maestroId === null && { $unset: { maestro: 1 } }),
        },
        { returnDocument: 'after' },
      )
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

  async listarPorPlan(planId: string): Promise<Materia[]> {
    const docs = await this.modelo
      .find({ plan: aObjectId(planId) })
      .sort({ bloque: 1, nombre: 1 })
      .lean<MateriaPlana[]>()
      .exec();
    return docs.map(aMateria);
  }

  async listarPorMaestro(maestroId: string): Promise<Materia[]> {
    const docs = await this.modelo
      .find({ maestro: aObjectId(maestroId) })
      .sort({ bloque: 1, nombre: 1 })
      .lean<MateriaPlana[]>()
      .exec();
    return docs.map(aMateria);
  }
}
