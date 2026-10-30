import { Global, Module } from '@nestjs/common';
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
  ],
  exports: [RELOJ, PUBLICADOR_EVENTOS, SUSCRIPTOR_EVENTOS],
})
export class SharedModule {}
