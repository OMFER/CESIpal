import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
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
import {
  ActualizarPlan,
  ConsultarBitacora,
  CrearPlan,
  EliminarPlan,
  ListarPlanes,
  ObtenerPlan,
} from '../application/gestionar-planes';
import { ActualizarPlanDto, CrearPlanDto } from './planes.dto';
import {
  presentarCambio,
  presentarPlan,
  presentarPlanDetallado,
} from './planes.presenter';
import * as i18n from '../../../i18n/es.json';

// Las versiones del plan de estudios las administra solo el admin
@ApiTags(i18n.swagger.planes.etiqueta)
@ApiBearerAuth()
@Controller('planes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.ADMIN)
export class PlanesController {
  constructor(
    private readonly crearPlan: CrearPlan,
    private readonly actualizarPlan: ActualizarPlan,
    private readonly eliminarPlan: EliminarPlan,
    private readonly listarPlanes: ListarPlanes,
    private readonly obtenerPlan: ObtenerPlan,
    private readonly consultarBitacora: ConsultarBitacora,
  ) {}

  @ApiOperation({ summary: i18n.swagger.planes.crear_summary })
  @Post()
  async crear(@Body() dto: CrearPlanDto, @ActorActual() actor: Actor) {
    return presentarPlan(await this.crearPlan.ejecutar(dto, actor));
  }

  @ApiOperation({ summary: i18n.swagger.planes.listar_summary })
  @Get()
  async listar() {
    return (await this.listarPlanes.ejecutar()).map(presentarPlan);
  }

  @ApiOperation({ summary: i18n.swagger.planes.obtener_summary })
  @Get(':id')
  async obtener(@Param('id', ParseObjectIdPipe) id: string) {
    return presentarPlanDetallado(await this.obtenerPlan.ejecutar(id));
  }

  @ApiOperation({ summary: i18n.swagger.planes.actualizar_summary })
  @Patch(':id')
  async actualizar(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: ActualizarPlanDto,
    @ActorActual() actor: Actor,
  ) {
    return presentarPlan(await this.actualizarPlan.ejecutar(id, dto, actor));
  }

  @ApiOperation({ summary: i18n.swagger.planes.eliminar_summary })
  @Delete(':id')
  @HttpCode(204)
  eliminar(@Param('id', ParseObjectIdPipe) id: string) {
    return this.eliminarPlan.ejecutar(id);
  }

  @ApiOperation({ summary: i18n.swagger.planes.bitacora_summary })
  @Get(':id/cambios')
  async cambios(@Param('id', ParseObjectIdPipe) id: string) {
    return (await this.consultarBitacora.ejecutar(id)).map(presentarCambio);
  }
}
