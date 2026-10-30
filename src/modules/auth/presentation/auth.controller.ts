import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { IniciarSesion } from '../application/iniciar-sesion';
import { LoginDto } from './login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly iniciarSesion: IniciarSesion) {}

  @Post('login')
  @HttpCode(201)
  async login(@Body() { correo, password }: LoginDto) {
    const { token, usuario } = await this.iniciarSesion.ejecutar(
      correo,
      password,
    );
    return {
      access_token: token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    };
  }
}
