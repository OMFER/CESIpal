import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RELOJ } from '../../shared/domain/reloj';
import { PUBLICADOR_EVENTOS } from '../../shared/domain/eventos';
import { casoDeUso } from '../../shared/infrastructure/caso-de-uso.provider';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { USUARIO_REPOSITORY } from '../usuarios/domain/usuario.repository';
import { MATERIA_REPOSITORY } from './domain/materia.repository';
import { GRUPO_REPOSITORY } from './domain/grupo.repository';
import { INSCRIPCION_REPOSITORY } from './domain/inscripcion.repository';
import { AccesoGrupos, AccesoMaterias } from './application/acceso';
import {
  ActualizarMateria,
  CrearMateria,
  EliminarMateria,
  ListarMaterias,
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
} from './infrastructure/materia.schema';
import { MongoMateriaRepository } from './infrastructure/mongo-materia.repository';
import { MongoGrupoRepository } from './infrastructure/mongo-grupo.repository';
import { MongoInscripcionRepository } from './infrastructure/mongo-inscripcion.repository';
import { MateriasController } from './presentation/materias.controller';
import { GruposController } from './presentation/grupos.controller';

const ACCESO = [GRUPO_REPOSITORY, MATERIA_REPOSITORY, INSCRIPCION_REPOSITORY];
const DETALLE = [MATERIA_REPOSITORY, USUARIO_REPOSITORY, RELOJ];

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MateriaModelo.name, schema: MateriaSchema },
      { name: GrupoModelo.name, schema: GrupoSchema },
    ]),
    UsuariosModule,
  ],
  controllers: [MateriasController, GruposController],
  providers: [
    { provide: MATERIA_REPOSITORY, useClass: MongoMateriaRepository },
    { provide: GRUPO_REPOSITORY, useClass: MongoGrupoRepository },
    { provide: INSCRIPCION_REPOSITORY, useClass: MongoInscripcionRepository },
    casoDeUso(AccesoGrupos, ACCESO),
    casoDeUso(AccesoMaterias, [
      MATERIA_REPOSITORY,
      GRUPO_REPOSITORY,
      INSCRIPCION_REPOSITORY,
    ]),
    casoDeUso(CrearMateria, [MATERIA_REPOSITORY]),
    casoDeUso(ActualizarMateria, [MATERIA_REPOSITORY]),
    casoDeUso(EliminarMateria, [
      MATERIA_REPOSITORY,
      GRUPO_REPOSITORY,
      PUBLICADOR_EVENTOS,
    ]),
    casoDeUso(ListarMaterias, [MATERIA_REPOSITORY]),
    casoDeUso(ObtenerMateria, [AccesoMaterias]),
    casoDeUso(CrearGrupo, [
      GRUPO_REPOSITORY,
      MATERIA_REPOSITORY,
      USUARIO_REPOSITORY,
    ]),
    casoDeUso(ActualizarGrupo, [GRUPO_REPOSITORY, USUARIO_REPOSITORY]),
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
  // Contenido semanal y exámenes reutilizan el control de acceso y los alumnos inscritos
  exports: [AccesoMaterias, AccesoGrupos, INSCRIPCION_REPOSITORY],
})
export class MateriasModule {}
