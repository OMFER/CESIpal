import { Rol } from '../../../shared/domain/actor';
import { NoEncontradoError } from '../../../shared/domain/errores';
import { Usuario } from '../domain/usuario';
import { UsuarioRepository } from '../domain/usuario.repository';

export class ObtenerUsuario {
  constructor(private readonly usuarios: UsuarioRepository) {}

  async ejecutar(id: string): Promise<Usuario> {
    const usuario = await this.usuarios.buscarPorId(id);
    if (!usuario) {
      throw new NoEncontradoError('Usuario no encontrado');
    }
    return usuario;
  }
}

export class ListarUsuarios {
  constructor(private readonly usuarios: UsuarioRepository) {}

  ejecutar(rol?: Rol): Promise<Usuario[]> {
    return this.usuarios.listar(rol);
  }
}
