import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ZONA_HORARIA, ZONA_HORARIA_POR_DEFECTO } from '../domain/fechas';
import { RELOJ } from '../domain/reloj';
import { PUBLICADOR_EVENTOS, SUSCRIPTOR_EVENTOS } from '../domain/eventos';
import { BITACORA } from '../domain/bitacora';
import { RelojDelSistema } from './reloj-del-sistema';
import { BusDeEventosEnMemoria } from './bus-de-eventos';
import { CambioModelo, CambioSchema } from './bitacora/bitacora.schema';
import { MongoBitacora } from './bitacora/mongo-bitacora';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CambioModelo.name, schema: CambioSchema },
    ]),
  ],
  providers: [
    { provide: RELOJ, useClass: RelojDelSistema },
    BusDeEventosEnMemoria,
    { provide: PUBLICADOR_EVENTOS, useExisting: BusDeEventosEnMemoria },
    { provide: SUSCRIPTOR_EVENTOS, useExisting: BusDeEventosEnMemoria },
    { provide: BITACORA, useClass: MongoBitacora },
    {
      provide: ZONA_HORARIA,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get<string>('ZONA_HORARIA') || ZONA_HORARIA_POR_DEFECTO,
    },
  ],
  exports: [
    RELOJ,
    PUBLICADOR_EVENTOS,
    SUSCRIPTOR_EVENTOS,
    ZONA_HORARIA,
    BITACORA,
  ],
})
export class SharedModule {}
