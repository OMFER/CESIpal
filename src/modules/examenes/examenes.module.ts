import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RELOJ } from '../../shared/domain/reloj';
import { casoDeUso } from '../../shared/infrastructure/caso-de-uso.provider';
import { MateriasModule } from '../materias/materias.module';
import { AccesoMaterias } from '../materias/application/acceso-materias';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { USUARIO_REPOSITORY } from '../usuarios/domain/usuario.repository';
import {
  EXAMEN_REPOSITORY,
  INTENTO_REPOSITORY,
} from './domain/examen.repository';
import {
  ActualizarExamen,
  CrearExamen,
  EliminarExamen,
} from './application/gestionar-examenes';
import {
  ListarExamenesDeMateria,
  ObtenerExamen,
  ObtenerExamenDeSemana,
} from './application/consultar-examenes';
import {
  ListarIntentos,
  ResponderExamen,
} from './application/responder-examen';
import {
  ExamenModelo,
  ExamenSchema,
  IntentoModelo,
  IntentoSchema,
} from './infrastructure/examen.schema';
import { MongoExamenRepository } from './infrastructure/mongo-examen.repository';
import { MongoIntentoRepository } from './infrastructure/mongo-intento.repository';
import { ExamenesController } from './presentation/examenes.controller';

const CONSULTA = [AccesoMaterias, EXAMEN_REPOSITORY, INTENTO_REPOSITORY];

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExamenModelo.name, schema: ExamenSchema },
      { name: IntentoModelo.name, schema: IntentoSchema },
    ]),
    MateriasModule,
    UsuariosModule,
  ],
  controllers: [ExamenesController],
  providers: [
    { provide: EXAMEN_REPOSITORY, useClass: MongoExamenRepository },
    { provide: INTENTO_REPOSITORY, useClass: MongoIntentoRepository },
    casoDeUso(CrearExamen, [AccesoMaterias, EXAMEN_REPOSITORY]),
    casoDeUso(ActualizarExamen, CONSULTA),
    casoDeUso(EliminarExamen, CONSULTA),
    casoDeUso(ObtenerExamen, CONSULTA),
    casoDeUso(ObtenerExamenDeSemana, CONSULTA),
    casoDeUso(ListarExamenesDeMateria, CONSULTA),
    casoDeUso(ResponderExamen, [...CONSULTA, RELOJ]),
    casoDeUso(ListarIntentos, [...CONSULTA, USUARIO_REPOSITORY]),
  ],
})
export class ExamenesModule {}
