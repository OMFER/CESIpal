import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, mongo, Types } from 'mongoose';
import { ConflictoError } from '../../../shared/domain/errores';
import { aObjectId } from '../../../shared/infrastructure/mongo/object-id';
import { Intento } from '../domain/intento';
import { DatosIntento, IntentoRepository } from '../domain/examen.repository';
import { IntentoModelo } from './examen.schema';

const CLAVE_DUPLICADA = 11000;

type IntentoPlano = Omit<IntentoModelo, 'examen' | 'grupo' | 'alumno'> & {
  _id: Types.ObjectId;
  examen: Types.ObjectId;
  grupo: Types.ObjectId;
  alumno: Types.ObjectId;
  createdAt: Date;
};

function aIntento(doc: IntentoPlano): Intento {
  return {
    id: doc._id.toString(),
    examenId: doc.examen.toString(),
    grupoId: doc.grupo.toString(),
    alumnoId: doc.alumno.toString(),
    respuestas: doc.respuestas,
    aciertos: doc.aciertos,
    totalPreguntas: doc.totalPreguntas,
    calificacion: doc.calificacion,
    fecha: doc.createdAt,
  };
}

@Injectable()
export class MongoIntentoRepository implements IntentoRepository {
  constructor(
    @InjectModel(IntentoModelo.name)
    private readonly modelo: Model<IntentoModelo>,
  ) {}

  async crear({
    examenId,
    grupoId,
    alumnoId,
    ...datos
  }: DatosIntento): Promise<Intento> {
    try {
      const doc = await this.modelo.create({
        ...datos,
        examen: aObjectId(examenId),
        grupo: aObjectId(grupoId),
        alumno: aObjectId(alumnoId),
      });
      return aIntento(doc.toObject<IntentoPlano>());
    } catch (error) {
      // Dos envíos simultáneos del mismo alumno: el índice único deja pasar solo uno
      if (
        error instanceof mongo.MongoServerError &&
        error.code === CLAVE_DUPLICADA
      ) {
        throw new ConflictoError('Ya respondiste este examen');
      }
      throw error;
    }
  }

  async buscar(
    examenId: string,
    grupoId: string,
    alumnoId: string,
  ): Promise<Intento | null> {
    const doc = await this.modelo
      .findOne({
        examen: aObjectId(examenId),
        grupo: aObjectId(grupoId),
        alumno: aObjectId(alumnoId),
      })
      .lean<IntentoPlano>()
      .exec();
    return doc ? aIntento(doc) : null;
  }

  async listarDeAlumno(grupoId: string, alumnoId: string): Promise<Intento[]> {
    const docs = await this.modelo
      .find({ grupo: aObjectId(grupoId), alumno: aObjectId(alumnoId) })
      .lean<IntentoPlano[]>()
      .exec();
    return docs.map(aIntento);
  }

  async listarDeGrupo(grupoId: string, examenId?: string): Promise<Intento[]> {
    const docs = await this.modelo
      .find({
        grupo: aObjectId(grupoId),
        ...(examenId && { examen: aObjectId(examenId) }),
      })
      .sort({ createdAt: 1 })
      .lean<IntentoPlano[]>()
      .exec();
    return docs.map(aIntento);
  }

  async existeParaExamen(examenId: string): Promise<boolean> {
    return (await this.modelo.exists({ examen: aObjectId(examenId) })) !== null;
  }

  async eliminarPorExamen(examenId: string): Promise<void> {
    await this.modelo.deleteMany({ examen: aObjectId(examenId) });
  }

  async eliminarDeGrupo(grupoId: string): Promise<void> {
    await this.modelo.deleteMany({ grupo: aObjectId(grupoId) });
  }
}
