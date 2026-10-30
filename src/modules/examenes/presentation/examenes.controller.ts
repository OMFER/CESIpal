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

// Exámenes como plantilla de la materia: solo para quien la edita
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

  @Post()
  async crear(@Body() dto: CrearExamenDto, @ActorActual() actor: Actor) {
    return presentarExamen(await this.crearExamen.ejecutar(dto, actor));
  }

  @Get('materia/:materiaId')
  async listar(
    @Param('materiaId', ParseObjectIdPipe) materiaId: string,
    @ActorActual() actor: Actor,
  ) {
    return (await this.listarExamenes.ejecutar(materiaId, actor)).map(
      presentarExamen,
    );
  }

  @Get(':id')
  async obtener(
    @Param('id', ParseObjectIdPipe) id: string,
    @ActorActual() actor: Actor,
  ) {
    return presentarExamen(await this.obtenerExamen.ejecutar(id, actor));
  }

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

  @Delete(':id')
  @HttpCode(204)
  eliminar(
    @Param('id', ParseObjectIdPipe) id: string,
    @ActorActual() actor: Actor,
  ) {
    return this.eliminarExamen.ejecutar(id, actor);
  }
}
