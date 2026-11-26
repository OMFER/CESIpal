import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RELOJ } from '../../shared/domain/reloj';
import { ZONA_HORARIA } from '../../shared/domain/fechas';
import { BITACORA } from '../../shared/domain/bitacora';
import { PUBLICADOR_EVENTOS } from '../../shared/domain/eventos';
import { casoDeUso } from '../../shared/infrastructure/caso-de-uso.provider';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { USUARIO_REPOSITORY } from '../usuarios/domain/usuario.repository';
import { PLAN_REPOSITORY } from './domain/plan.repository';
import { MATERIA_REPOSITORY } from './domain/materia.repository';
import { GRUPO_REPOSITORY } from './domain/grupo.repository';
import { INSCRIPCION_REPOSITORY } from './domain/inscripcion.repository';
import { AccesoGrupos, AccesoMaterias } from './application/acceso';
import {
  ActualizarPlan,
  ConsultarBitacora,
  CrearPlan,
  EliminarPlan,
  ListarPlanes,
  ObtenerPlan,
} from './application/gestionar-planes';
import {
  ActualizarMateria,
  CrearMateria,
  EliminarMateria,
  ListarMisMaterias,
  ObtenerMateria,
} from './application/gestionar-materias';
import {
  ActualizarGrupo,
  CrearGrupo,
  EliminarGrupo,
} from './application/gestionar-grupos';
import {
  ListarGrupos,
  ObtenerGrupo,
  ObtenerMisGrupos,
} from './application/consultar-grupos';
import {
  DarDeBajaAlumno,
  InscribirAlumnos,
  ListarAlumnosDeGrupo,
} from './application/gestionar-inscripciones';
import {
  GrupoModelo,
  GrupoSchema,
  MateriaModelo,
  MateriaSchema,
  PlanModelo,
  PlanSchema,
} from './infrastructure/planes.schema';
import { MongoPlanRepository } from './infrastructure/mongo-plan.repository';
import { MongoMateriaRepository } from './infrastructure/mongo-materia.repository';
import { MongoGrupoRepository } from './infrastructure/mongo-grupo.repository';
import { MongoInscripcionRepository } from './infrastructure/mongo-inscripcion.repository';
import { PlanesController } from './presentation/planes.controller';
import { MateriasController } from './presentation/materias.controller';
import { GruposController } from './presentation/grupos.controller';

const DETALLE = [
  PLAN_REPOSITORY,
  MATERIA_REPOSITORY,
  USUARIO_REPOSITORY,
  RELOJ,
];
const EDICION_DE_MATERIAS = [
  PLAN_REPOSITORY,
  MATERIA_REPOSITORY,
  USUARIO_REPOSITORY,
  BITACORA,
];

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PlanModelo.name, schema: PlanSchema },
      { name: MateriaModelo.name, schema: MateriaSchema },
      { name: GrupoModelo.name, schema: GrupoSchema },
    ]),
    UsuariosModule,
  ],
  controllers: [PlanesController, MateriasController, GruposController],
  providers: [
    { provide: PLAN_REPOSITORY, useClass: MongoPlanRepository },
    { provide: MATERIA_REPOSITORY, useClass: MongoMateriaRepository },
    { provide: GRUPO_REPOSITORY, useClass: MongoGrupoRepository },
    { provide: INSCRIPCION_REPOSITORY, useClass: MongoInscripcionRepository },
    casoDeUso(AccesoMaterias, [
      MATERIA_REPOSITORY,
      PLAN_REPOSITORY,
      GRUPO_REPOSITORY,
      INSCRIPCION_REPOSITORY,
    ]),
    casoDeUso(AccesoGrupos, [
      GRUPO_REPOSITORY,
      PLAN_REPOSITORY,
      MATERIA_REPOSITORY,
      INSCRIPCION_REPOSITORY,
    ]),
    casoDeUso(CrearPlan, [PLAN_REPOSITORY, BITACORA]),
    casoDeUso(ActualizarPlan, [PLAN_REPOSITORY, BITACORA]),
    casoDeUso(EliminarPlan, [
      PLAN_REPOSITORY,
      MATERIA_REPOSITORY,
      GRUPO_REPOSITORY,
      BITACORA,
      PUBLICADOR_EVENTOS,
    ]),
    casoDeUso(ListarPlanes, [PLAN_REPOSITORY]),
    casoDeUso(ObtenerPlan, [
      PLAN_REPOSITORY,
      MATERIA_REPOSITORY,
      USUARIO_REPOSITORY,
    ]),
    casoDeUso(ConsultarBitacora, [PLAN_REPOSITORY, BITACORA]),
    casoDeUso(CrearMateria, EDICION_DE_MATERIAS),
    casoDeUso(ActualizarMateria, EDICION_DE_MATERIAS),
    casoDeUso(EliminarMateria, [
      PLAN_REPOSITORY,
      MATERIA_REPOSITORY,
      BITACORA,
      PUBLICADOR_EVENTOS,
    ]),
    casoDeUso(ObtenerMateria, [AccesoMaterias]),
    casoDeUso(ListarMisMaterias, [MATERIA_REPOSITORY, PLAN_REPOSITORY]),
    casoDeUso(CrearGrupo, [GRUPO_REPOSITORY, PLAN_REPOSITORY, ZONA_HORARIA]),
    casoDeUso(ActualizarGrupo, [GRUPO_REPOSITORY, RELOJ, ZONA_HORARIA]),
    casoDeUso(EliminarGrupo, [
      GRUPO_REPOSITORY,
      INSCRIPCION_REPOSITORY,
      PUBLICADOR_EVENTOS,
    ]),
    casoDeUso(ListarGrupos, [GRUPO_REPOSITORY, ...DETALLE]),
    casoDeUso(ObtenerMisGrupos, [
      GRUPO_REPOSITORY,
      INSCRIPCION_REPOSITORY,
      ...DETALLE,
    ]),
    casoDeUso(ObtenerGrupo, [AccesoGrupos, ...DETALLE]),
    casoDeUso(InscribirAlumnos, [GRUPO_REPOSITORY, INSCRIPCION_REPOSITORY]),
    casoDeUso(DarDeBajaAlumno, [INSCRIPCION_REPOSITORY]),
    casoDeUso(ListarAlumnosDeGrupo, [AccesoGrupos, INSCRIPCION_REPOSITORY]),
  ],
  // Contenido, exámenes y publicación reutilizan el control de acceso, los planes y sus materias
  exports: [
    AccesoMaterias,
    AccesoGrupos,
    PLAN_REPOSITORY,
    MATERIA_REPOSITORY,
    INSCRIPCION_REPOSITORY,
  ],
})
export class PlanesModule {}
