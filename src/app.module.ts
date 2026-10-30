import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SharedModule } from './shared/infrastructure/shared.module';
import { validarEntorno } from './shared/infrastructure/config/validar-entorno';
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { MateriasModule } from './modules/materias/materias.module';
import { ClasesModule } from './modules/clases/clases.module';
import { ExamenesModule } from './modules/examenes/examenes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validarEntorno }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGO_URI'),
      }),
    }),
    SharedModule,
    AuthModule,
    UsuariosModule,
    MateriasModule,
    ClasesModule,
    ExamenesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
