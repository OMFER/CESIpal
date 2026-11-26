import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';

type ConId = { _id: Types.ObjectId };

/**
 * Pasa una base del modelo anterior (materia por semestre, grupo por materia, exámenes
 * Semanal/Reposición/Final) al plan de estudios. Esos datos eran de prueba y no tienen
 * equivalente: se borran, junto con lo que dependía de ellos. Después alinea los índices
 * con los esquemas actuales (quita los viejos, como el único por tipo de examen).
 * Se aplica sola al arrancar y no hace nada si la base ya está al día.
 */
@Injectable()
export class MigracionAlPlanDeEstudios implements OnApplicationBootstrap {
  private readonly logger = new Logger(MigracionAlPlanDeEstudios.name);

  constructor(@InjectConnection() private readonly conexion: Connection) {}

  async onApplicationBootstrap() {
    await this.borrarDatosAnteriores();
    for (const modelo of Object.values(this.conexion.models)) {
      await modelo.syncIndexes();
    }
  }

  private coleccion(nombre: string) {
    return this.conexion.collection<ConId & Record<string, unknown>>(nombre);
  }

  private async ids(nombre: string) {
    const docs = await this.coleccion(nombre)
      .find({}, { projection: { _id: 1 } })
      .toArray();
    return docs.map((d) => d._id);
  }

  private async borrar(nombre: string, filtro: Record<string, unknown>) {
    const { deletedCount } = await this.coleccion(nombre).deleteMany(filtro);
    if (deletedCount) {
      this.logger.warn(
        `Se borraron ${deletedCount} documentos de "${nombre}" del modelo anterior`,
      );
    }
  }

  private async borrarDatosAnteriores() {
    const sinPlan = { plan: { $exists: false } };
    const gruposViejos = await this.coleccion('grupos')
      .find(sinPlan, { projection: { _id: 1 } })
      .toArray();
    if (gruposViejos.length) {
      const ids = gruposViejos.map((g) => g._id);
      // Los alumnos dejan de estar inscritos en esos grupos
      await this.conexion
        .collection<{ grupos: Types.ObjectId[] }>('usuarios')
        .updateMany({}, { $pullAll: { grupos: ids } });
    }
    await this.borrar('grupos', sinPlan);
    await this.borrar('materias', sinPlan);
    await this.borrar('examenes', { numero: { $exists: false } });
    await this.borrar('clases', {
      materia: { $nin: await this.ids('materias') },
    });
    await this.borrar('intentos', {
      $or: [
        { examen: { $nin: await this.ids('examenes') } },
        { grupo: { $nin: await this.ids('grupos') } },
      ],
    });
  }
}
