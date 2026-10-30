import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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
import {
  ActualizarClase,
  CrearClase,
  EliminarClase,
  ListarClasesDeMateria,
  ObtenerClaseDeSemana,
} from '../application/gestionar-clases';
import { ActualizarClaseDto, CrearClaseDto } from './clase.dto';
import { presentarClase } from './clase.presenter';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import * as i18n from '../../../i18n/es.json';

const aFecha = <T extends { fechaEnVivo?: string }>({
  fechaEnVivo,
  ...resto
}: T) =>
  fechaEnVivo === undefined
    ? resto
    : { ...resto, fechaEnVivo: new Date(fechaEnVivo) };

@ApiTags(i18n.swagger.clases.etiqueta)
@ApiBearerAuth()
@Controller('clases')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClasesController {
  constructor(
    private readonly crearClase: CrearClase,
    private readonly actualizarClase: ActualizarClase,
    private readonly eliminarClase: EliminarClase,
    private readonly listarClases: ListarClasesDeMateria,
    private readonly obtenerClaseDeSemana: ObtenerClaseDeSemana,
  ) {}

  @ApiOperation({ summary: i18n.swagger.clases.crear_summary })
  @Post()
  @Roles(Rol.MAESTRO, Rol.ADMIN)
  async crear(@Body() dto: CrearClaseDto, @ActorActual() actor: Actor) {
    return presentarClase(await this.crearClase.ejecutar(aFecha(dto), actor));
  }

  @ApiOperation({ summary: i18n.swagger.clases.listar_summary })
  @Get('materia/:materiaId')
  async listar(
    @Param('materiaId', ParseObjectIdPipe) materiaId: string,
    @ActorActual() actor: Actor,
  ) {
    return (await this.listarClases.ejecutar(materiaId, actor)).map(
      presentarClase,
    );
  }

  @ApiOperation({ summary: i18n.swagger.clases.semana_summary })
  @Get('materia/:materiaId/semana/:semana')
  async porSemana(
    @Param('materiaId', ParseObjectIdPipe) materiaId: string,
    @Param('semana', ParseIntPipe) semana: number,
    @ActorActual() actor: Actor,
  ) {
    return presentarClase(
      await this.obtenerClaseDeSemana.ejecutar(materiaId, semana, actor),
    );
  }

  @ApiOperation({ summary: i18n.swagger.clases.actualizar_summary })
  @Patch(':id')
  @Roles(Rol.MAESTRO, Rol.ADMIN)
  async actualizar(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: ActualizarClaseDto,
    @ActorActual() actor: Actor,
  ) {
    return presentarClase(
      await this.actualizarClase.ejecutar(id, aFecha(dto), actor),
    );
  }

  @ApiOperation({ summary: i18n.swagger.clases.eliminar_summary })
  @Delete(':id')
  @Roles(Rol.MAESTRO, Rol.ADMIN)
  @HttpCode(204)
  eliminar(
    @Param('id', ParseObjectIdPipe) id: string,
    @ActorActual() actor: Actor,
  ) {
    return this.eliminarClase.ejecutar(id, actor);
  }
}
