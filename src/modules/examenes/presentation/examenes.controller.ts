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
  ActualizarExamen,
  CrearExamen,
  EliminarExamen,
} from '../application/gestionar-examenes';
import {
  ListarExamenesDeMateria,
  ObtenerExamen,
  ObtenerExamenDeSemana,
} from '../application/consultar-examenes';
import {
  ListarIntentos,
  ResponderExamen,
} from '../application/responder-examen';
import {
  ActualizarExamenDto,
  CrearExamenDto,
  ResponderExamenDto,
} from './examen.dto';
import {
  presentarExamen,
  presentarExamenEnLista,
  presentarIntento,
  presentarResumenIntento,
} from './examen.presenter';

const aFecha = <T extends { fechaLimite?: string }>({
  fechaLimite,
  ...resto
}: T) =>
  fechaLimite === undefined
    ? resto
    : { ...resto, fechaLimite: new Date(fechaLimite) };

@Controller('examenes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamenesController {
  constructor(
    private readonly crearExamen: CrearExamen,
    private readonly actualizarExamen: ActualizarExamen,
    private readonly eliminarExamen: EliminarExamen,
    private readonly obtenerExamen: ObtenerExamen,
    private readonly obtenerExamenDeSemana: ObtenerExamenDeSemana,
    private readonly listarExamenes: ListarExamenesDeMateria,
    private readonly responderExamen: ResponderExamen,
    private readonly listarIntentos: ListarIntentos,
  ) {}

  @Post()
  @Roles(Rol.MAESTRO, Rol.ADMIN)
  async crear(@Body() dto: CrearExamenDto, @ActorActual() actor: Actor) {
    const examen = await this.crearExamen.ejecutar(aFecha(dto), actor);
    return presentarExamen({ examen, conRespuestas: true });
  }

  @Get('materia/:materiaId')
  async listar(
    @Param('materiaId', ParseObjectIdPipe) materiaId: string,
    @ActorActual() actor: Actor,
  ) {
    return (await this.listarExamenes.ejecutar(materiaId, actor)).map(
      presentarExamenEnLista,
    );
  }

  @Get('materia/:materiaId/semana/:semana')
  async porSemana(
    @Param('materiaId', ParseObjectIdPipe) materiaId: string,
    @Param('semana', ParseIntPipe) semana: number,
    @ActorActual() actor: Actor,
  ) {
    return presentarExamen(
      await this.obtenerExamenDeSemana.ejecutar(materiaId, semana, actor),
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
  @Roles(Rol.MAESTRO, Rol.ADMIN)
  async actualizar(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: ActualizarExamenDto,
    @ActorActual() actor: Actor,
  ) {
    const examen = await this.actualizarExamen.ejecutar(id, aFecha(dto), actor);
    return presentarExamen({ examen, conRespuestas: true });
  }

  @Delete(':id')
  @Roles(Rol.MAESTRO, Rol.ADMIN)
  @HttpCode(204)
  eliminar(
    @Param('id', ParseObjectIdPipe) id: string,
    @ActorActual() actor: Actor,
  ) {
    return this.eliminarExamen.ejecutar(id, actor);
  }

  @Post(':id/intentos')
  @Roles(Rol.ALUMNO)
  async responder(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: ResponderExamenDto,
    @ActorActual() actor: Actor,
  ) {
    return presentarResumenIntento(
      await this.responderExamen.ejecutar(id, dto.respuestas, actor),
    );
  }

  @Get(':id/intentos')
  async intentos(
    @Param('id', ParseObjectIdPipe) id: string,
    @ActorActual() actor: Actor,
  ) {
    return (await this.listarIntentos.ejecutar(id, actor)).map(
      presentarIntento,
    );
  }
}
