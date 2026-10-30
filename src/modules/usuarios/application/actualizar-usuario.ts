import { Rol } from '../../../shared/domain/actor';
import {
  ConflictoError,
  NoEncontradoError,
} from '../../../shared/domain/errores';
import { normalizarCorreo, Usuario, validarPassword } from '../domain/usuario';
import { DatosUsuario, UsuarioRepository } from '../domain/usuario.repository';
import { PasswordHasher } from '../domain/password-hasher';

export interface CambiosUsuario {
  nombre?: string;
  correo?: string;
  password?: string;
  rol?: Rol;
}

export class ActualizarUsuario {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async ejecutar(
    id: string,
    { nombre, correo, password, rol }: CambiosUsuario,
  ): Promise<Usuario> {
    const cambios: Partial<DatosUsuario> = {};
    if (nombre !== undefined) cambios.nombre = nombre.trim();
    if (rol !== undefined) cambios.rol = rol;
    if (correo !== undefined) {
      cambios.correo = normalizarCorreo(correo);
      if (await this.usuarios.existeCorreo(cambios.correo, id)) {
        throw new ConflictoError('El correo ya está registrado');
      }
    }
    if (password !== undefined) {
      validarPassword(password);
      cambios.passwordHash = await this.hasher.hash(password);
    }

    const usuario = await this.usuarios.actualizar(id, cambios);
    if (!usuario) {
      throw new NoEncontradoError('Usuario no encontrado');
    }
    return usuario;
  }
}
