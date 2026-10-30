import { NoAutenticadoError } from '../../../shared/domain/errores';
import { normalizarCorreo, Usuario } from '../../usuarios/domain/usuario';
import { UsuarioRepository } from '../../usuarios/domain/usuario.repository';
import { PasswordHasher } from '../../usuarios/domain/password-hasher';
import { TokenService } from '../domain/token.service';

export interface Sesion {
  token: string;
  usuario: Usuario;
}

export class IniciarSesion {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
  ) {}

  async ejecutar(correo: string, password: string): Promise<Sesion> {
    const credenciales = await this.usuarios.buscarCredenciales(
      normalizarCorreo(correo),
    );
    // Mismo mensaje para correo inexistente y contraseña incorrecta: no revela qué cuentas existen
    if (
      !credenciales ||
      !(await this.hasher.coincide(password, credenciales.passwordHash))
    ) {
      throw new NoAutenticadoError('Credenciales inválidas');
    }
    const { usuario } = credenciales;
    return {
      token: this.tokens.firmar({
        id: usuario.id,
        correo: usuario.correo,
        rol: usuario.rol,
      }),
      usuario,
    };
  }
}
