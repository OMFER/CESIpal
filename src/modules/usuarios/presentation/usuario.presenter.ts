import { Usuario } from '../domain/usuario';

// Forma JSON pública de un usuario; nunca incluye la contraseña
export function presentarUsuario(usuario: Usuario) {
  return {
    _id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
    grupos: usuario.grupoIds,
  };
}

export function presentarUsuarioResumen(
  usuario: Pick<Usuario, 'id' | 'nombre' | 'correo'>,
) {
  return { _id: usuario.id, nombre: usuario.nombre, correo: usuario.correo };
}
