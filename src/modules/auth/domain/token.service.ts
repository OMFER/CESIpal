import { Actor } from '../../../shared/domain/actor';

export interface TokenService {
  firmar(actor: Actor): string;
}

export const TOKEN_SERVICE = Symbol('TokenService');
