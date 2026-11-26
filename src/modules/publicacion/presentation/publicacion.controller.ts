import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Actor } from '../../../shared/domain/actor';
import { Rol } from '../../../shared/domain/actor';
import { ParseObjectIdPipe } from '../../../shared/presentation/parse-object-id.pipe';
import {
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '../../auth/presentation/guards';
import { ActorActual } from '../../auth/presentation/actor-actual.decorator';
import { presentarPlan } from '../../planes/presentation/planes.presenter';
import {
  CrearNuevaVersion,
  PublicarPlan,
  RevisarPlan,
} from '../application/publicacion';
import * as i18n from '../../../i18n/es.json';

@ApiTags(i18n.swagger.planes.etiqueta)
@ApiBearerAuth()
@Controller('planes/:id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.ADMIN)
export class PublicacionController {
  constructor(
    private readonly revisarPlan: RevisarPlan,
    private readonly publicarPlan: PublicarPlan,
    private readonly crearNuevaVersion: CrearNuevaVersion,
  ) {}

  @ApiOperation({ summary: i18n.swagger.planes.pendientes_summary })
  @Get('pendientes')
  async pendientes(@Param('id', ParseObjectIdPipe) id: string) {
    const pendientes = await this.revisarPlan.ejecutar(id);
    return { listo: pendientes.length === 0, pendientes };
  }

  @ApiOperation({ summary: i18n.swagger.planes.publicar_summary })
  @Post('publicar')
  async publicar(
    @Param('id', ParseObjectIdPipe) id: string,
    @ActorActual() actor: Actor,
  ) {
    return presentarPlan(await this.publicarPlan.ejecutar(id, actor));
  }

  @ApiOperation({ summary: i18n.swagger.planes.version_summary })
  @Post('versiones')
  async nuevaVersion(
    @Param('id', ParseObjectIdPipe) id: string,
    @ActorActual() actor: Actor,
  ) {
    return presentarPlan(await this.crearNuevaVersion.ejecutar(id, actor));
  }
}
