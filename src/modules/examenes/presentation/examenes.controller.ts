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
  ActualizarExamen,
  CrearExamen,
  EliminarExamen,
  ListarExamenesDeMateria,
  ObtenerExamenDeMateria,
} from '../application/gestionar-examenes';
import { ActualizarExamenDto, CrearExamenDto } from './examen.dto';
import { presentarExamen } from './examen.presenter';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import * as i18n from '../../../i18n/es.json';

// Exámenes como plantilla de la materia: solo para quien la edita
@ApiTags(i18n.swagger.examenes.etiqueta)
@ApiBearerAuth()
@Controller('examenes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.MAESTRO, Rol.ADMIN)
export class ExamenesController {
  constructor(
    private readonly crearExamen: CrearExamen,
    private readonly actualizarExamen: ActualizarExamen,
    private readonly eliminarExamen: EliminarExamen,
    private readonly listarExamenes: ListarExamenesDeMateria,
    private readonly obtenerExamen: ObtenerExamenDeMateria,
  ) {}

  @ApiOperation({ summary: i18n.swagger.examenes.crear_summary })
  @Post()
  async crear(@Body() dto: CrearExamenDto, @ActorActual() actor: Actor) {
    return presentarExamen(await this.crearExamen.ejecutar(dto, actor));
  }

  @ApiOperation({ summary: i18n.swagger.examenes.listar_summary })
  @Get('materia/:materiaId')
  async listar(
    @Param('materiaId', ParseObjectIdPipe) materiaId: string,
    @ActorActual() actor: Actor,
  ) {
    return (await this.listarExamenes.ejecutar(materiaId, actor)).map(
      presentarExamen,
    );
  }

  @ApiOperation({ summary: i18n.swagger.examenes.obtener_summary })
  @Get(':id')
  async obtener(
    @Param('id', ParseObjectIdPipe) id: string,
    @ActorActual() actor: Actor,
  ) {
    return presentarExamen(await this.obtenerExamen.ejecutar(id, actor));
  }

  @ApiOperation({ summary: i18n.swagger.examenes.actualizar_summary })
  @Patch(':id')
  async actualizar(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: ActualizarExamenDto,
    @ActorActual() actor: Actor,
  ) {
    return presentarExamen(
      await this.actualizarExamen.ejecutar(id, dto, actor),
    );
  }

  @ApiOperation({ summary: i18n.swagger.examenes.eliminar_summary })
  @Delete(':id')
  @HttpCode(204)
  eliminar(
    @Param('id', ParseObjectIdPipe) id: string,
    @ActorActual() actor: Actor,
  ) {
    return this.eliminarExamen.ejecutar(id, actor);
  }
}
