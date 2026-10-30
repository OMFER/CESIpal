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
import { GrupoModelo } from './materia.schema';

type GrupoPlano = Omit<GrupoModelo, 'materia' | 'maestro'> & {
  _id: Types.ObjectId;
  materia: Types.ObjectId;
  maestro: Types.ObjectId;
};

function aGrupo(doc: GrupoPlano): Grupo {
  return {
    id: doc._id.toString(),
    materiaId: doc.materia.toString(),
    maestroId: doc.maestro.toString(),
    nombre: doc.nombre,
    periodo: doc.periodo,
    aula: doc.aula,
    fechaInicio: doc.fechaInicio,
  };
}

function aDocumento({ materiaId, maestroId, ...resto }: Partial<DatosGrupo>) {
  return {
    ...resto,
    ...(materiaId && { materia: aObjectId(materiaId) }),
    ...(maestroId && { maestro: aObjectId(maestroId) }),
  };
}

@Injectable()
export class MongoGrupoRepository implements GrupoRepository {
  constructor(
    @InjectModel(GrupoModelo.name) private readonly modelo: Model<GrupoModelo>,
  ) {}

  async crear(datos: DatosGrupo): Promise<Grupo> {
    const doc = await this.modelo.create(aDocumento(datos));
    return aGrupo(doc.toObject<GrupoPlano>());
  }

  async actualizar(id: string, cambios: CambiosGrupo): Promise<Grupo | null> {
    const doc = await this.modelo
      .findByIdAndUpdate(id, aDocumento(cambios), { new: true })
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
      .lean<GrupoPlano[]>()
      .exec();
    return docs.map(aGrupo);
  }

  async listar(): Promise<Grupo[]> {
    const docs = await this.modelo
      .find()
      .sort({ periodo: -1, nombre: 1 })
      .lean<GrupoPlano[]>()
      .exec();
    return docs.map(aGrupo);
  }

  async listarPorMaestro(maestroId: string): Promise<Grupo[]> {
    const docs = await this.modelo
      .find({ maestro: aObjectId(maestroId) })
      .sort({ periodo: -1, nombre: 1 })
      .lean<GrupoPlano[]>()
      .exec();
    return docs.map(aGrupo);
  }

  async existeDeMateria(materiaId: string): Promise<boolean> {
    return (
      (await this.modelo.exists({ materia: aObjectId(materiaId) })) !== null
    );
  }

  async maestroImparteMateria(
    maestroId: string,
    materiaId: string,
  ): Promise<boolean> {
    const existe = await this.modelo.exists({
      maestro: aObjectId(maestroId),
      materia: aObjectId(materiaId),
    });
    return existe !== null;
  }
}
