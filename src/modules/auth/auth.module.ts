import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { casoDeUso } from '../../shared/infrastructure/caso-de-uso.provider';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { USUARIO_REPOSITORY } from '../usuarios/domain/usuario.repository';
import { PASSWORD_HASHER } from '../usuarios/domain/password-hasher';
import { TOKEN_SERVICE } from './domain/token.service';
import { IniciarSesion } from './application/iniciar-sesion';
import { JwtTokenService } from './infrastructure/jwt-token.service';
import { JwtStrategy } from './infrastructure/jwt.strategy';
import { AuthController } from './presentation/auth.controller';

@Module({
  imports: [
    UsuariosModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '8h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    casoDeUso(IniciarSesion, [
      USUARIO_REPOSITORY,
      PASSWORD_HASHER,
      TOKEN_SERVICE,
    ]),
  ],
})
export class AuthModule {}
