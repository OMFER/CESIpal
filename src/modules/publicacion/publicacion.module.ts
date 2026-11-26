import { Module } from '@nestjs/common';
import { RELOJ } from '../../shared/domain/reloj';
import { BITACORA } from '../../shared/domain/bitacora';
import { casoDeUso } from '../../shared/infrastructure/caso-de-uso.provider';
import { PlanesModule } from '../planes/planes.module';
import { PLAN_REPOSITORY } from '../planes/domain/plan.repository';
import { MATERIA_REPOSITORY } from '../planes/domain/materia.repository';
import { ClasesModule } from '../clases/clases.module';
import { CLASE_REPOSITORY } from '../clases/domain/clase.repository';
import { ExamenesModule } from '../examenes/examenes.module';
import { EXAMEN_REPOSITORY } from '../examenes/domain/examen.repository';
import {
  CrearNuevaVersion,
  PublicarPlan,
  RevisarPlan,
} from './application/publicacion';
import { MigracionAlPlanDeEstudios } from './infrastructure/migracion-plan-de-estudios.bootstrap';
import { PublicacionController } from './presentation/publicacion.controller';

const PLAN_COMPLETO = [
  PLAN_REPOSITORY,
  MATERIA_REPOSITORY,
  CLASE_REPOSITORY,
  EXAMEN_REPOSITORY,
];

// Une planes, contenido y exámenes: lo que necesita ver el plan completo vive aquí
@Module({
  imports: [PlanesModule, ClasesModule, ExamenesModule],
  controllers: [PublicacionController],
  providers: [
    casoDeUso(RevisarPlan, PLAN_COMPLETO),
    casoDeUso(PublicarPlan, [...PLAN_COMPLETO, BITACORA, RELOJ]),
    casoDeUso(CrearNuevaVersion, [...PLAN_COMPLETO, BITACORA]),
    MigracionAlPlanDeEstudios,
  ],
})
export class PublicacionModule {}
