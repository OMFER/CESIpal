import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
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
  ListarExamenesDeGrupo,
  ObtenerExamenEnGrupo,
  ObtenerExamenesDeSemana,
  ResponderExamen,
} from '../application/examenes-de-grupo';
import {
  ListarIntentosDeGrupo,
  ObtenerCalificaciones,
} from '../application/resultados-de-grupo';
import { ResponderExamenDto } from './examen.dto';
import {
  presentarBoleta,
  presentarExamenEnGrupo,
  presentarExamenesDeSemana,
  presentarIntento,
  presentarResultadoDeIntento,
  presentarResumenExamen,
} from './examen.presenter';

// Exámenes tal como se presentan en un grupo: con sus fechas, intentos y calificaciones
@Controller('grupos/:grupoId')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamenesDeGrupoController {
  constructor(
    private readonly listarExamenes: ListarExamenesDeGrupo,
    private readonly obtenerDeSemana: ObtenerExamenesDeSemana,
    private readonly obtenerExamen: ObtenerExamenEnGrupo,
    private readonly responderExamen: ResponderExamen,
    private readonly listarIntentos: ListarIntentosDeGrupo,
    private readonly obtenerCalificaciones: ObtenerCalificaciones,
  ) {}

  @Get('examenes')
  async listar(
    @Param('grupoId', ParseObjectIdPipe) grupoId: string,
    @ActorActual() actor: Actor,
  ) {
    return (await this.listarExamenes.ejecutar(grupoId, actor)).map(
      presentarResumenExamen,
    );
  }

  @Get('examenes/semana/:semana')
  async deSemana(
    @Param('grupoId', ParseObjectIdPipe) grupoId: string,
    @Param('semana', ParseIntPipe) semana: number,
    @ActorActual() actor: Actor,
  ) {
    return presentarExamenesDeSemana(
      await this.obtenerDeSemana.ejecutar(grupoId, semana, actor),
    );
  }

  @Get('examenes/:examenId')
  async obtener(
    @Param('grupoId', ParseObjectIdPipe) grupoId: string,
    @Param('examenId', ParseObjectIdPipe) examenId: string,
    @ActorActual() actor: Actor,
  ) {
    return presentarExamenEnGrupo(
      await this.obtenerExamen.ejecutar(grupoId, examenId, actor),
    );
  }

  @Post('examenes/:examenId/intentos')
  @Roles(Rol.ALUMNO)
  async responder(
    @Param('grupoId', ParseObjectIdPipe) grupoId: string,
    @Param('examenId', ParseObjectIdPipe) examenId: string,
    @Body() dto: ResponderExamenDto,
    @ActorActual() actor: Actor,
  ) {
    return presentarResultadoDeIntento(
      await this.responderExamen.ejecutar(
        grupoId,
        examenId,
        dto.respuestas,
        actor,
      ),
    );
  }

  @Get('examenes/:examenId/intentos')
  async intentos(
    @Param('grupoId', ParseObjectIdPipe) grupoId: string,
    @Param('examenId', ParseObjectIdPipe) examenId: string,
    @ActorActual() actor: Actor,
  ) {
    return (await this.listarIntentos.ejecutar(grupoId, examenId, actor)).map(
      presentarIntento,
    );
  }

  @Get('calificaciones')
  async calificaciones(
    @Param('grupoId', ParseObjectIdPipe) grupoId: string,
    @ActorActual() actor: Actor,
  ) {
    return (await this.obtenerCalificaciones.ejecutar(grupoId, actor)).map(
      presentarBoleta,
    );
  }
}
