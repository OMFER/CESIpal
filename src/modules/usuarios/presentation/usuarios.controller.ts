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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import * as i18n from '../../../i18n/es.json';

@ApiTags(i18n.swagger.usuarios.etiqueta)
@ApiBearerAuth()
@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsuariosController {
  constructor(
    private readonly crearUsuario: CrearUsuario,
    private readonly actualizarUsuario: ActualizarUsuario,
    private readonly obtenerUsuario: ObtenerUsuario,
    private readonly listarUsuarios: ListarUsuarios,
  ) {}

  @ApiOperation({ summary: i18n.swagger.usuarios.me_summary })
  @Get('me')
  async me(@ActorActual() actor: Actor) {
    return presentarUsuario(await this.obtenerUsuario.ejecutar(actor.id));
  }

  @ApiOperation({ summary: i18n.swagger.usuarios.crear_summary })
  @Post()
  @Roles(Rol.ADMIN)
  async crear(@Body() dto: CrearUsuarioDto) {
    return presentarUsuario(await this.crearUsuario.ejecutar(dto));
  }

  @ApiOperation({ summary: i18n.swagger.usuarios.listar_summary })
  @Get()
  @Roles(Rol.ADMIN)
  async listar(@Query('rol') rol?: Rol) {
    return (await this.listarUsuarios.ejecutar(rol)).map(presentarUsuario);
  }

  @ApiOperation({ summary: i18n.swagger.usuarios.obtener_summary })
  @Get(':id')
  @Roles(Rol.ADMIN)
  async obtener(@Param('id', ParseObjectIdPipe) id: string) {
    return presentarUsuario(await this.obtenerUsuario.ejecutar(id));
  }

  @ApiOperation({ summary: i18n.swagger.usuarios.actualizar_summary })
  @Patch(':id')
  @Roles(Rol.ADMIN)
  async actualizar(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: ActualizarUsuarioDto,
  ) {
    return presentarUsuario(await this.actualizarUsuario.ejecutar(id, dto));
  }
}
