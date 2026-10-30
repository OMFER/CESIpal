import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Actor } from '../../../shared/domain/actor';
import { TokenService } from '../domain/token.service';

export interface PayloadJwt {
  sub: string;
  correo: string;
  rol: Actor['rol'];
}

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(private readonly jwt: JwtService) {}

  firmar({ id, correo, rol }: Actor): string {
    const payload: PayloadJwt = { sub: id, correo, rol };
    return this.jwt.sign(payload);
  }
}
