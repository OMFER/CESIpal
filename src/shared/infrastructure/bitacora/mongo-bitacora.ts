import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Bitacora, Cambio, NuevoCambio } from '../../domain/bitacora';
import { aObjectId } from '../mongo/object-id';
import { CambioModelo } from './bitacora.schema';

type CambioPlano = Omit<CambioModelo, 'plan' | 'entidadId' | 'autor'> & {
  _id: Types.ObjectId;
  plan: Types.ObjectId;
  entidadId: Types.ObjectId;
  autor: Types.ObjectId;
  createdAt: Date;
};

const aCambio = (doc: CambioPlano): Cambio => ({
  id: doc._id.toString(),
  planId: doc.plan.toString(),
  entidad: doc.entidad,
  entidadId: doc.entidadId.toString(),
  accion: doc.accion,
  autorId: doc.autor.toString(),
  fecha: doc.createdAt,
  antes: doc.antes,
  despues: doc.despues,
});

@Injectable()
export class MongoBitacora implements Bitacora {
  constructor(
    @InjectModel(CambioModelo.name)
    private readonly modelo: Model<CambioModelo>,
  ) {}

  async registrar({
    planId,
    entidadId,
    autorId,
    ...resto
  }: NuevoCambio): Promise<void> {
    await this.modelo.create({
      ...resto,
      plan: aObjectId(planId),
      entidadId: aObjectId(entidadId),
      autor: aObjectId(autorId),
    });
  }

  async listarDePlan(planId: string): Promise<Cambio[]> {
    const docs = await this.modelo
      .find({ plan: aObjectId(planId) })
      .sort({ createdAt: -1 })
      .lean<CambioPlano[]>()
      .exec();
    return docs.map(aCambio);
  }

  async eliminarDePlan(planId: string): Promise<void> {
    await this.modelo.deleteMany({ plan: aObjectId(planId) });
  }
}
