import { Rol } from '../../../shared/domain/actor';
import { Usuario } from './usuario';

export interface DatosUsuario {
  nombre: string;
  correo: string;
  rol: Rol;
  passwordHash: string;
}

export interface CredencialesUsuario {
  usuario: Usuario;
  passwordHash: string;
}

export interface UsuarioRepository {
  crear(datos: DatosUsuario): Promise<Usuario>;
  actualizar(
    id: string,
    cambios: Partial<DatosUsuario>,
  ): Promise<Usuario | null>;
  buscarPorId(id: string): Promise<Usuario | null>;
  buscarPorIds(ids: string[]): Promise<Usuario[]>;
  buscarCredenciales(correo: string): Promise<CredencialesUsuario | null>;
  existeCorreo(correo: string, excluirId?: string): Promise<boolean>;
  existeConRol(rol: Rol): Promise<boolean>;
  listar(rol?: Rol): Promise<Usuario[]>;
}

export const USUARIO_REPOSITORY = Symbol('UsuarioRepository');
