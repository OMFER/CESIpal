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
  ActualizarMateria,
  CrearMateria,
  EliminarMateria,
  ListarMisMaterias,
  ObtenerMateria,
} from '../application/gestionar-materias';
import { ActualizarMateriaDto, CrearMateriaDto } from './planes.dto';
import { presentarMateria, presentarMateriaEnPlan } from './planes.presenter';
import * as i18n from '../../../i18n/es.json';

@ApiTags(i18n.swagger.materias.etiqueta)
@ApiBearerAuth()
@Controller('materias')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MateriasController {
  constructor(
    private readonly crearMateria: CrearMateria,
    private readonly actualizarMateria: ActualizarMateria,
    private readonly eliminarMateria: EliminarMateria,
    private readonly obtenerMateria: ObtenerMateria,
    private readonly listarMisMaterias: ListarMisMaterias,
  ) {}

  @ApiOperation({ summary: i18n.swagger.materias.crear_summary })
  @Post()
  @Roles(Rol.ADMIN)
  async crear(@Body() dto: CrearMateriaDto, @ActorActual() actor: Actor) {
    return presentarMateria(await this.crearMateria.ejecutar(dto, actor));
  }

  @ApiOperation({ summary: i18n.swagger.materias.mias_summary })
  @Get('mias')
  @Roles(Rol.MAESTRO)
  async mias(@ActorActual() actor: Actor) {
    return (await this.listarMisMaterias.ejecutar(actor)).map(
      presentarMateriaEnPlan,
    );
  }

  @ApiOperation({ summary: i18n.swagger.materias.obtener_summary })
  @Get(':id')
  async obtener(
    @Param('id', ParseObjectIdPipe) id: string,
    @ActorActual() actor: Actor,
  ) {
    return presentarMateriaEnPlan(
      await this.obtenerMateria.ejecutar(id, actor),
    );
  }

  @ApiOperation({ summary: i18n.swagger.materias.actualizar_summary })
  @Patch(':id')
  @Roles(Rol.ADMIN)
  async actualizar(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: ActualizarMateriaDto,
    @ActorActual() actor: Actor,
  ) {
    return presentarMateria(
      await this.actualizarMateria.ejecutar(id, dto, actor),
    );
  }

  @ApiOperation({ summary: i18n.swagger.materias.eliminar_summary })
  @Delete(':id')
  @Roles(Rol.ADMIN)
  @HttpCode(204)
  eliminar(
    @Param('id', ParseObjectIdPipe) id: string,
    @ActorActual() actor: Actor,
  ) {
    return this.eliminarMateria.ejecutar(id, actor);
  }
}
