import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, mongo } from 'mongoose';
import { IntentoModelo } from './examen.schema';

// Índices de versiones anteriores que contradicen las reglas actuales
const INDICES_OBSOLETOS = [
  // Un intento por alumno y examen sin importar el grupo: impedía presentar de nuevo al recursar la materia
  'examen_1_alumno_1',
];
const COLECCION_INEXISTENTE = 26;

@Injectable()
export class MigracionesDeExamenes implements OnApplicationBootstrap {
  private readonly logger = new Logger(MigracionesDeExamenes.name);

  constructor(
    @InjectModel(IntentoModelo.name)
    private readonly intentos: Model<IntentoModelo>,
  ) {}

  async onApplicationBootstrap() {
    let existentes: string[];
    try {
      existentes = (await this.intentos.collection.indexes()).map(
        (i) => i.name ?? '',
      );
    } catch (error) {
      if (
        error instanceof mongo.MongoServerError &&
        error.code === COLECCION_INEXISTENTE
      ) {
        return;
      }
      throw error;
    }

    for (const nombre of INDICES_OBSOLETOS.filter((n) =>
      existentes.includes(n),
    )) {
      await this.intentos.collection.dropIndex(nombre);
      this.logger.log(`Índice obsoleto eliminado: intentos.${nombre}`);
    }
  }
}
