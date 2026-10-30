export interface PasswordHasher {
  hash(password: string): Promise<string>;
  coincide(password: string, hash: string): Promise<boolean>;
}

export const PASSWORD_HASHER = Symbol('PasswordHasher');
