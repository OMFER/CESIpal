import { Global, Module } from '@nestjs/common';
import { RELOJ } from '../domain/reloj';
import { RelojDelSistema } from './reloj-del-sistema';

@Global()
@Module({
  providers: [{ provide: RELOJ, useClass: RelojDelSistema }],
  exports: [RELOJ],
})
export class SharedModule {}
