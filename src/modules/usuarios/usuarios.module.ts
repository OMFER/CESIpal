import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { casoDeUso } from '../../shared/infrastructure/caso-de-uso.provider';
import { USUARIO_REPOSITORY } from './domain/usuario.repository';
import { PASSWORD_HASHER } from './domain/password-hasher';
import { CrearUsuario } from './application/crear-usuario';
import { ActualizarUsuario } from './application/actualizar-usuario';
import {
  ListarUsuarios,
  ObtenerUsuario,
} from './application/consultar-usuarios';
import { CrearAdminInicial } from './application/crear-admin-inicial';
import { UsuarioModelo, UsuarioSchema } from './infrastructure/usuario.schema';
import { MongoUsuarioRepository } from './infrastructure/mongo-usuario.repository';
import { BcryptPasswordHasher } from './infrastructure/bcrypt-password-hasher';
import { AdminInicialBootstrap } from './infrastructure/admin-inicial.bootstrap';
import { UsuariosController } from './presentation/usuarios.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UsuarioModelo.name, schema: UsuarioSchema },
    ]),
  ],
  controllers: [UsuariosController],
  providers: [
    { provide: USUARIO_REPOSITORY, useClass: MongoUsuarioRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    casoDeUso(CrearUsuario, [USUARIO_REPOSITORY, PASSWORD_HASHER]),
    casoDeUso(ActualizarUsuario, [USUARIO_REPOSITORY, PASSWORD_HASHER]),
    casoDeUso(ObtenerUsuario, [USUARIO_REPOSITORY]),
    casoDeUso(ListarUsuarios, [USUARIO_REPOSITORY]),
    casoDeUso(CrearAdminInicial, [USUARIO_REPOSITORY, CrearUsuario]),
    AdminInicialBootstrap,
  ],
  // El modelo se exporta para el repositorio de inscripciones del módulo de materias
  exports: [USUARIO_REPOSITORY, PASSWORD_HASHER, MongooseModule],
})
export class UsuariosModule {}
