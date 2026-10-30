import * as bcrypt from 'bcrypt';
import { PasswordHasher } from '../domain/password-hasher';

const RONDAS = 10;

export class BcryptPasswordHasher implements PasswordHasher {
  hash(password: string): Promise<string> {
    return bcrypt.hash(password, RONDAS);
  }

  coincide(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
