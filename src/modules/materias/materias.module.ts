import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RELOJ } from '../../shared/domain/reloj';
import { casoDeUso } from '../../shared/infrastructure/caso-de-uso.provider';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { USUARIO_REPOSITORY } from '../usuarios/domain/usuario.repository';
import { MATERIA_REPOSITORY } from './domain/materia.repository';
import { INSCRIPCION_REPOSITORY } from './domain/inscripcion.repository';
import { AccesoMaterias } from './application/acceso-materias';
import {
  ActualizarMateria,
  CrearMateria,
  EliminarMateria,
  ListarMaterias,
} from './application/gestionar-materias';
import {
  ObtenerMateria,
  ObtenerMisMaterias,
} from './application/consultar-calendario';
import {
  DarDeBajaAlumno,
  InscribirAlumnos,
  ListarAlumnosDeMateria,
} from './application/gestionar-inscripciones';
import { MateriaModelo, MateriaSchema } from './infrastructure/materia.schema';
import { MongoMateriaRepository } from './infrastructure/mongo-materia.repository';
import { MongoInscripcionRepository } from './infrastructure/mongo-inscripcion.repository';
import { MateriasController } from './presentation/materias.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MateriaModelo.name, schema: MateriaSchema },
    ]),
    UsuariosModule,
  ],
  controllers: [MateriasController],
  providers: [
    { provide: MATERIA_REPOSITORY, useClass: MongoMateriaRepository },
    { provide: INSCRIPCION_REPOSITORY, useClass: MongoInscripcionRepository },
    casoDeUso(AccesoMaterias, [MATERIA_REPOSITORY, INSCRIPCION_REPOSITORY]),
    casoDeUso(CrearMateria, [MATERIA_REPOSITORY, USUARIO_REPOSITORY]),
    casoDeUso(ActualizarMateria, [MATERIA_REPOSITORY, USUARIO_REPOSITORY]),
    casoDeUso(EliminarMateria, [MATERIA_REPOSITORY]),
    casoDeUso(ListarMaterias, [MATERIA_REPOSITORY, USUARIO_REPOSITORY]),
    casoDeUso(ObtenerMisMaterias, [
      MATERIA_REPOSITORY,
      INSCRIPCION_REPOSITORY,
      USUARIO_REPOSITORY,
      RELOJ,
    ]),
    casoDeUso(ObtenerMateria, [AccesoMaterias, USUARIO_REPOSITORY, RELOJ]),
    casoDeUso(InscribirAlumnos, [MATERIA_REPOSITORY, INSCRIPCION_REPOSITORY]),
    casoDeUso(DarDeBajaAlumno, [INSCRIPCION_REPOSITORY]),
    casoDeUso(ListarAlumnosDeMateria, [AccesoMaterias, INSCRIPCION_REPOSITORY]),
  ],
  // Contenido semanal y exámenes reutilizan el control de acceso
  exports: [AccesoMaterias],
})
export class MateriasModule {}
