import { Rol } from '../../../shared/domain/actor';
import { ConflictoError } from '../../../shared/domain/errores';
import { normalizarCorreo, Usuario, validarPassword } from '../domain/usuario';
import { UsuarioRepository } from '../domain/usuario.repository';
import { PasswordHasher } from '../domain/password-hasher';

export interface NuevoUsuario {
  nombre: string;
  correo: string;
  password: string;
  rol: Rol;
}

export class CrearUsuario {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async ejecutar({
    nombre,
    correo,
    password,
    rol,
  }: NuevoUsuario): Promise<Usuario> {
    validarPassword(password);
    const correoNormalizado = normalizarCorreo(correo);
    if (await this.usuarios.existeCorreo(correoNormalizado)) {
      throw new ConflictoError('El correo ya está registrado');
    }
    return this.usuarios.crear({
      nombre: nombre.trim(),
      correo: correoNormalizado,
      rol,
      passwordHash: await this.hasher.hash(password),
    });
  }
}
