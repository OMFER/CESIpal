import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { casoDeUso } from '../../shared/infrastructure/caso-de-uso.provider';
import { manejadorDeEventos } from '../../shared/infrastructure/manejador-de-eventos.provider';
import { SUSCRIPTOR_EVENTOS } from '../../shared/domain/eventos';
import { BorrarContenidoAlEliminarMateria } from './application/al-eliminar-materia';
import { MateriasModule } from '../materias/materias.module';
import { AccesoMaterias } from '../materias/application/acceso';
import { CLASE_REPOSITORY } from './domain/clase.repository';
import {
  ActualizarClase,
  CrearClase,
  EliminarClase,
  ListarClasesDeMateria,
  ObtenerClaseDeSemana,
} from './application/gestionar-clases';
import { ClaseModelo, ClaseSchema } from './infrastructure/clase.schema';
import { MongoClaseRepository } from './infrastructure/mongo-clase.repository';
import { ClasesController } from './presentation/clases.controller';

const DEPENDENCIAS = [AccesoMaterias, CLASE_REPOSITORY];

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ClaseModelo.name, schema: ClaseSchema },
    ]),
    MateriasModule,
  ],
  controllers: [ClasesController],
  providers: [
    { provide: CLASE_REPOSITORY, useClass: MongoClaseRepository },
    casoDeUso(CrearClase, DEPENDENCIAS),
    casoDeUso(ActualizarClase, DEPENDENCIAS),
    casoDeUso(EliminarClase, DEPENDENCIAS),
    casoDeUso(ListarClasesDeMateria, DEPENDENCIAS),
    casoDeUso(ObtenerClaseDeSemana, DEPENDENCIAS),
    manejadorDeEventos(BorrarContenidoAlEliminarMateria, [
      SUSCRIPTOR_EVENTOS,
      CLASE_REPOSITORY,
    ]),
  ],
})
export class ClasesModule {}
