import { Rol } from '../../../shared/domain/actor';
import { UsuarioRepository } from '../domain/usuario.repository';
import { CrearUsuario } from './crear-usuario';

// No hay registro público: si todavía no existe ningún admin, se crea el primero
export class CrearAdminInicial {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly crearUsuario: CrearUsuario,
  ) {}

  async ejecutar(correo: string, password: string): Promise<boolean> {
    if (await this.usuarios.existeConRol(Rol.ADMIN)) return false;
    await this.crearUsuario.ejecutar({
      nombre: 'Administrador',
      correo,
      password,
      rol: Rol.ADMIN,
    });
    return true;
  }
}
