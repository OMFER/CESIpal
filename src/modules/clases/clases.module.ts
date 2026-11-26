import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { casoDeUso } from '../../shared/infrastructure/caso-de-uso.provider';
import { manejadorDeEventos } from '../../shared/infrastructure/manejador-de-eventos.provider';
import { SUSCRIPTOR_EVENTOS } from '../../shared/domain/eventos';
import { BITACORA } from '../../shared/domain/bitacora';
import { BorrarContenidoAlEliminarMateria } from './application/al-eliminar-materia';
import { PlanesModule } from '../planes/planes.module';
import { AccesoMaterias } from '../planes/application/acceso';
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

const LECTURA = [AccesoMaterias, CLASE_REPOSITORY];
const EDICION = [AccesoMaterias, CLASE_REPOSITORY, BITACORA];

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ClaseModelo.name, schema: ClaseSchema },
    ]),
    PlanesModule,
  ],
  controllers: [ClasesController],
  providers: [
    { provide: CLASE_REPOSITORY, useClass: MongoClaseRepository },
    casoDeUso(CrearClase, EDICION),
    casoDeUso(ActualizarClase, EDICION),
    casoDeUso(EliminarClase, EDICION),
    casoDeUso(ListarClasesDeMateria, LECTURA),
    casoDeUso(ObtenerClaseDeSemana, LECTURA),
    manejadorDeEventos(BorrarContenidoAlEliminarMateria, [
      SUSCRIPTOR_EVENTOS,
      CLASE_REPOSITORY,
    ]),
  ],
  // La publicación revisa que cada semana tenga contenido y lo copia a las versiones nuevas
  exports: [CLASE_REPOSITORY],
})
export class ClasesModule {}
