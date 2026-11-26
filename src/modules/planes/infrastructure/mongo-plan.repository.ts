import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, mongo, Types } from 'mongoose';
import { ConflictoError } from '../../../shared/domain/errores';
import { aObjectIds } from '../../../shared/infrastructure/mongo/object-id';
import { Plan } from '../domain/plan';
import {
  CambiosPlan,
  DatosPlan,
  PlanRepository,
} from '../domain/plan.repository';
import { PlanModelo } from './planes.schema';

const CLAVE_DUPLICADA = 11000;

type PlanPlano = PlanModelo & { _id: Types.ObjectId };

const aPlan = (doc: PlanPlano): Plan => ({
  id: doc._id.toString(),
  nombre: doc.nombre,
  descripcion: doc.descripcion,
  version: doc.version,
  estado: doc.estado,
  publicadoEn: doc.publicadoEn,
});

@Injectable()
export class MongoPlanRepository implements PlanRepository {
  constructor(
    @InjectModel(PlanModelo.name) private readonly modelo: Model<PlanModelo>,
  ) {}

  async crear(datos: DatosPlan): Promise<Plan> {
    try {
      const doc = await this.modelo.create(datos);
      return aPlan(doc.toObject<PlanPlano>());
    } catch (error) {
      if (
        error instanceof mongo.MongoServerError &&
        error.code === CLAVE_DUPLICADA
      ) {
        throw new ConflictoError(
          `Ya existe la versión ${datos.version} de "${datos.nombre}"; intenta de nuevo`,
        );
      }
      throw error;
    }
  }

  async actualizar(id: string, cambios: CambiosPlan): Promise<Plan | null> {
    const doc = await this.modelo
      .findByIdAndUpdate(id, cambios, { returnDocument: 'after' })
      .lean<PlanPlano>()
      .exec();
    return doc ? aPlan(doc) : null;
  }

  async eliminar(id: string): Promise<void> {
    await this.modelo.findByIdAndDelete(id).exec();
  }

  async buscarPorId(id: string): Promise<Plan | null> {
    const doc = await this.modelo.findById(id).lean<PlanPlano>().exec();
    return doc ? aPlan(doc) : null;
  }

  async buscarPorIds(ids: string[]): Promise<Plan[]> {
    const docs = await this.modelo
      .find({ _id: { $in: aObjectIds(ids) } })
      .lean<PlanPlano[]>()
      .exec();
    return docs.map(aPlan);
  }

  async listar(): Promise<Plan[]> {
    const docs = await this.modelo
      .find()
      .sort({ nombre: 1, version: -1 })
      .lean<PlanPlano[]>()
      .exec();
    return docs.map(aPlan);
  }

  async ultimaVersion(nombre: string): Promise<number> {
    const doc = await this.modelo
      .findOne({ nombre })
      .sort({ version: -1 })
      .select('version')
      .lean<Pick<PlanPlano, 'version'>>()
      .exec();
    return doc?.version ?? 0;
  }
}
