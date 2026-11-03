import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { aObjectId } from '../../../shared/infrastructure/mongo/object-id';
import { UsoDeSemanas } from '../domain/uso-de-semanas';

// Colecciones de los módulos de contenido y exámenes. Se leen aquí directamente porque
// esos módulos dependen de este y no al revés.
const COLECCIONES_CON_SEMANA = ['clases', 'examenes'];

@Injectable()
export class MongoUsoDeSemanas implements UsoDeSemanas {
  constructor(@InjectConnection() private readonly conexion: Connection) {}

  async ultimaSemanaOcupada(materiaId: string): Promise<number> {
    const maximos = await Promise.all(
      COLECCIONES_CON_SEMANA.map(async (nombre) => {
        const [doc] = await this.conexion
          .collection<{ semana?: number }>(nombre)
          .find({ materia: aObjectId(materiaId), semana: { $exists: true } })
          .sort({ semana: -1 })
          .limit(1)
          .toArray();
        return doc?.semana ?? 0;
      }),
    );
    return Math.max(0, ...maximos);
  }
}
