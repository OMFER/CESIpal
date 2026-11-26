import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  aObjectId,
  aObjectIds,
} from '../../../shared/infrastructure/mongo/object-id';
import { Grupo } from '../domain/grupo';
import {
  CambiosGrupo,
  DatosGrupo,
  GrupoRepository,
} from '../domain/grupo.repository';
import { GrupoModelo } from './planes.schema';

type GrupoPlano = Omit<GrupoModelo, 'plan'> & {
  _id: Types.ObjectId;
  plan: Types.ObjectId;
};

const aGrupo = (doc: GrupoPlano): Grupo => ({
  id: doc._id.toString(),
  planId: doc.plan.toString(),
  nombre: doc.nombre,
  fechaInicio: doc.fechaInicio,
});

// Del más reciente al más antiguo
const ORDEN = { fechaInicio: -1, nombre: 1 } as const;

@Injectable()
export class MongoGrupoRepository implements GrupoRepository {
  constructor(
    @InjectModel(GrupoModelo.name) private readonly modelo: Model<GrupoModelo>,
  ) {}

  async crear({ planId, ...datos }: DatosGrupo): Promise<Grupo> {
    const doc = await this.modelo.create({ ...datos, plan: aObjectId(planId) });
    return aGrupo(doc.toObject<GrupoPlano>());
  }

  async actualizar(id: string, cambios: CambiosGrupo): Promise<Grupo | null> {
    const doc = await this.modelo
      .findByIdAndUpdate(id, cambios, { returnDocument: 'after' })
      .lean<GrupoPlano>()
      .exec();
    return doc ? aGrupo(doc) : null;
  }

  async eliminar(id: string): Promise<void> {
    await this.modelo.findByIdAndDelete(id).exec();
  }

  async buscarPorId(id: string): Promise<Grupo | null> {
    const doc = await this.modelo.findById(id).lean<GrupoPlano>().exec();
    return doc ? aGrupo(doc) : null;
  }

  async buscarPorIds(ids: string[]): Promise<Grupo[]> {
    const docs = await this.modelo
      .find({ _id: { $in: aObjectIds(ids) } })
      .sort(ORDEN)
      .lean<GrupoPlano[]>()
      .exec();
    return docs.map(aGrupo);
  }

  async listar(): Promise<Grupo[]> {
    const docs = await this.modelo
      .find()
      .sort(ORDEN)
      .lean<GrupoPlano[]>()
      .exec();
    return docs.map(aGrupo);
  }

  async listarPorPlanes(planIds: string[]): Promise<Grupo[]> {
    const docs = await this.modelo
      .find({ plan: { $in: aObjectIds(planIds) } })
      .sort(ORDEN)
      .lean<GrupoPlano[]>()
      .exec();
    return docs.map(aGrupo);
  }

  async existeDePlan(planId: string): Promise<boolean> {
    return (await this.modelo.exists({ plan: aObjectId(planId) })) !== null;
  }
}
