import { Rol } from '../../../shared/domain/actor';
import {
  ConflictoError,
  DatosInvalidosError,
  NoAutenticadoError,
} from '../../../shared/domain/errores';
import { HasherFalso, UsuariosEnMemoria } from '../../../testing/en-memoria';
import { CrearUsuario } from '../../usuarios/application/crear-usuario';
import { CrearAdminInicial } from '../../usuarios/application/crear-admin-inicial';
import { TokenService } from '../domain/token.service';
import { IniciarSesion } from './iniciar-sesion';

const tokens: TokenService = { firmar: (actor) => `token-de-${actor.id}` };

async function preparar() {
  const usuarios = new UsuariosEnMemoria();
  const hasher = new HasherFalso();
  const crearUsuario = new CrearUsuario(usuarios, hasher);
  const usuario = await crearUsuario.ejecutar({
    nombre: ' Luis ',
    correo: ' Luis@Escuela.MX ',
    password: 'secreto1',
    rol: Rol.ALUMNO,
  });
  return {
    usuarios,
    hasher,
    crearUsuario,
    usuario,
    iniciarSesion: new IniciarSesion(usuarios, hasher, tokens),
  };
}

describe('CrearUsuario', () => {
  it('normaliza el correo y nunca guarda la contraseña en claro', async () => {
    const { usuarios, usuario } = await preparar();
    expect(usuario.correo).toBe('luis@escuela.mx');
    expect(usuario.nombre).toBe('Luis');
    expect(usuarios.registros.get(usuario.id)?.passwordHash).toBe(
      'hash:secreto1',
    );
  });

  it('rechaza correos repetidos y contraseñas cortas', async () => {
    const { crearUsuario } = await preparar();
    await expect(
      crearUsuario.ejecutar({
        nombre: 'x',
        correo: 'LUIS@escuela.mx',
        password: 'secreto1',
        rol: Rol.ALUMNO,
      }),
    ).rejects.toThrow(ConflictoError);
    await expect(
      crearUsuario.ejecutar({
        nombre: 'x',
        correo: 'nuevo@escuela.mx',
        password: '123',
        rol: Rol.ALUMNO,
      }),
    ).rejects.toThrow(DatosInvalidosError);
  });
});

describe('CrearAdminInicial', () => {
  it('crea el admin solo si todavía no existe ninguno', async () => {
    const { usuarios, crearUsuario } = await preparar();
    const caso = new CrearAdminInicial(usuarios, crearUsuario);
    expect(await caso.ejecutar('admin@escuela.mx', 'admin123')).toBe(true);
    expect(await caso.ejecutar('otro@escuela.mx', 'admin123')).toBe(false);
    expect(await usuarios.listar(Rol.ADMIN)).toHaveLength(1);
  });
});

describe('IniciarSesion', () => {
  it('devuelve un token con credenciales válidas, sin importar mayúsculas en el correo', async () => {
    const { iniciarSesion, usuario } = await preparar();
    const sesion = await iniciarSesion.ejecutar('LUIS@escuela.mx', 'secreto1');
    expect(sesion.token).toBe(`token-de-${usuario.id}`);
    expect(sesion.usuario.rol).toBe(Rol.ALUMNO);
  });

  it('responde igual para correo inexistente y contraseña incorrecta', async () => {
    const { iniciarSesion } = await preparar();
    await expect(
      iniciarSesion.ejecutar('luis@escuela.mx', 'mal'),
    ).rejects.toThrow('Credenciales inválidas');
    await expect(
      iniciarSesion.ejecutar('nadie@escuela.mx', 'secreto1'),
    ).rejects.toThrow(NoAutenticadoError);
  });
});
