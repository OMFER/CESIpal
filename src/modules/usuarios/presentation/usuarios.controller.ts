import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { Actor } from '../../../shared/domain/actor';
import { Rol } from '../../../shared/domain/actor';
import { ParseObjectIdPipe } from '../../../shared/presentation/parse-object-id.pipe';
import {
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '../../auth/presentation/guards';
import { ActorActual } from '../../auth/presentation/actor-actual.decorator';
import { CrearUsuario } from '../application/crear-usuario';
import { ActualizarUsuario } from '../application/actualizar-usuario';
import {
  ListarUsuarios,
  ObtenerUsuario,
} from '../application/consultar-usuarios';
import { ActualizarUsuarioDto, CrearUsuarioDto } from './usuario.dto';
import { presentarUsuario } from './usuario.presenter';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsuariosController {
  constructor(
    private readonly crearUsuario: CrearUsuario,
    private readonly actualizarUsuario: ActualizarUsuario,
    private readonly obtenerUsuario: ObtenerUsuario,
    private readonly listarUsuarios: ListarUsuarios,
  ) {}

  @Get('me')
  async me(@ActorActual() actor: Actor) {
    return presentarUsuario(await this.obtenerUsuario.ejecutar(actor.id));
  }

  @Post()
  @Roles(Rol.ADMIN)
  async crear(@Body() dto: CrearUsuarioDto) {
    return presentarUsuario(await this.crearUsuario.ejecutar(dto));
  }

  @Get()
  @Roles(Rol.ADMIN)
  async listar(@Query('rol') rol?: Rol) {
    return (await this.listarUsuarios.ejecutar(rol)).map(presentarUsuario);
  }

  @Get(':id')
  @Roles(Rol.ADMIN)
  async obtener(@Param('id', ParseObjectIdPipe) id: string) {
    return presentarUsuario(await this.obtenerUsuario.ejecutar(id));
  }

  @Patch(':id')
  @Roles(Rol.ADMIN)
  async actualizar(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: ActualizarUsuarioDto,
  ) {
    return presentarUsuario(await this.actualizarUsuario.ejecutar(id, dto));
  }
}
