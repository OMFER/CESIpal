import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RELOJ } from '../../shared/domain/reloj';
import { SUSCRIPTOR_EVENTOS } from '../../shared/domain/eventos';
import { casoDeUso } from '../../shared/infrastructure/caso-de-uso.provider';
import { manejadorDeEventos } from '../../shared/infrastructure/manejador-de-eventos.provider';
import { MateriasModule } from '../materias/materias.module';
import { AccesoGrupos, AccesoMaterias } from '../materias/application/acceso';
import { INSCRIPCION_REPOSITORY } from '../materias/domain/inscripcion.repository';
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
  ListarExamenesDeMateria,
  ObtenerExamenDeMateria,
} from './application/gestionar-examenes';
import {
  ListarExamenesDeGrupo,
  ObtenerExamenEnGrupo,
  ObtenerExamenesDeSemana,
  ResponderExamen,
} from './application/examenes-de-grupo';
import {
  ListarIntentosDeGrupo,
  ObtenerCalificaciones,
} from './application/resultados-de-grupo';
import { LimpiezaDeExamenes } from './application/limpieza';
import {
  ExamenModelo,
  ExamenSchema,
  IntentoModelo,
  IntentoSchema,
} from './infrastructure/examen.schema';
import { MongoExamenRepository } from './infrastructure/mongo-examen.repository';
import { MongoIntentoRepository } from './infrastructure/mongo-intento.repository';
import { ExamenesController } from './presentation/examenes.controller';
import { ExamenesDeGrupoController } from './presentation/examenes-de-grupo.controller';

const PLANTILLA = [AccesoMaterias, EXAMEN_REPOSITORY, INTENTO_REPOSITORY];
const EN_GRUPO = [AccesoGrupos, EXAMEN_REPOSITORY, INTENTO_REPOSITORY, RELOJ];

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExamenModelo.name, schema: ExamenSchema },
      { name: IntentoModelo.name, schema: IntentoSchema },
    ]),
    MateriasModule,
    UsuariosModule,
  ],
  controllers: [ExamenesController, ExamenesDeGrupoController],
  providers: [
    { provide: EXAMEN_REPOSITORY, useClass: MongoExamenRepository },
    { provide: INTENTO_REPOSITORY, useClass: MongoIntentoRepository },
    casoDeUso(CrearExamen, [AccesoMaterias, EXAMEN_REPOSITORY]),
    casoDeUso(ActualizarExamen, PLANTILLA),
    casoDeUso(EliminarExamen, PLANTILLA),
    casoDeUso(ListarExamenesDeMateria, [AccesoMaterias, EXAMEN_REPOSITORY]),
    casoDeUso(ObtenerExamenDeMateria, [AccesoMaterias, EXAMEN_REPOSITORY]),
    casoDeUso(ListarExamenesDeGrupo, EN_GRUPO),
    casoDeUso(ObtenerExamenesDeSemana, EN_GRUPO),
    casoDeUso(ObtenerExamenEnGrupo, EN_GRUPO),
    casoDeUso(ResponderExamen, EN_GRUPO),
    casoDeUso(ListarIntentosDeGrupo, [
      AccesoGrupos,
      EXAMEN_REPOSITORY,
      INTENTO_REPOSITORY,
      USUARIO_REPOSITORY,
    ]),
    casoDeUso(ObtenerCalificaciones, [
      AccesoGrupos,
      INSCRIPCION_REPOSITORY,
      EXAMEN_REPOSITORY,
      INTENTO_REPOSITORY,
      USUARIO_REPOSITORY,
    ]),
    manejadorDeEventos(LimpiezaDeExamenes, [
      SUSCRIPTOR_EVENTOS,
      EXAMEN_REPOSITORY,
      INTENTO_REPOSITORY,
    ]),
  ],
})
export class ExamenesModule {}
