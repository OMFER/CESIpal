import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ZONA_HORARIA, ZONA_HORARIA_POR_DEFECTO } from '../domain/fechas';
import { RELOJ } from '../domain/reloj';
import { PUBLICADOR_EVENTOS, SUSCRIPTOR_EVENTOS } from '../domain/eventos';
import { RelojDelSistema } from './reloj-del-sistema';
import { BusDeEventosEnMemoria } from './bus-de-eventos';

@Global()
@Module({
  providers: [
    { provide: RELOJ, useClass: RelojDelSistema },
    BusDeEventosEnMemoria,
    { provide: PUBLICADOR_EVENTOS, useExisting: BusDeEventosEnMemoria },
    { provide: SUSCRIPTOR_EVENTOS, useExisting: BusDeEventosEnMemoria },
    {
      provide: ZONA_HORARIA,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get<string>('ZONA_HORARIA') || ZONA_HORARIA_POR_DEFECTO,
    },
  ],
  exports: [RELOJ, PUBLICADOR_EVENTOS, SUSCRIPTOR_EVENTOS, ZONA_HORARIA],
})
export class SharedModule {}
