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
import { presentarUsuario } from '../../usuarios/presentation/usuario.presenter';
import {
  ActualizarGrupo,
  CrearGrupo,
  EliminarGrupo,
} from '../application/gestionar-grupos';
import {
  ListarGrupos,
  ObtenerGrupo,
  ObtenerMisGrupos,
} from '../application/consultar-grupos';
import {
  DarDeBajaAlumno,
  InscribirAlumnos,
  ListarAlumnosDeGrupo,
} from '../application/gestionar-inscripciones';
import {
  ActualizarGrupoDto,
  CrearGrupoDto,
  InscribirAlumnosDto,
} from './materia.dto';
import { presentarGrupo } from './materia.presenter';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import * as i18n from '../../../i18n/es.json';

const conFecha = <T extends { fechaInicio?: string }>({
  fechaInicio,
  ...resto
}: T) =>
  fechaInicio === undefined
    ? resto
    : { ...resto, fechaInicio: new Date(fechaInicio) };

@ApiTags(i18n.swagger.grupos.etiqueta)
@ApiBearerAuth()
@Controller('grupos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GruposController {
  constructor(
    private readonly crearGrupo: CrearGrupo,
    private readonly actualizarGrupo: ActualizarGrupo,
    private readonly eliminarGrupo: EliminarGrupo,
    private readonly listarGrupos: ListarGrupos,
    private readonly obtenerMisGrupos: ObtenerMisGrupos,
    private readonly obtenerGrupo: ObtenerGrupo,
    private readonly inscribirAlumnos: InscribirAlumnos,
    private readonly darDeBajaAlumno: DarDeBajaAlumno,
    private readonly listarAlumnos: ListarAlumnosDeGrupo,
  ) {}

  @ApiOperation({ summary: i18n.swagger.grupos.crear_summary })
  @Post()
  @Roles(Rol.ADMIN)
  async crear(@Body() dto: CrearGrupoDto, @ActorActual() actor: Actor) {
    const grupo = await this.crearGrupo.ejecutar({
      ...dto,
      fechaInicio: new Date(dto.fechaInicio),
    });
    return presentarGrupo(await this.obtenerGrupo.ejecutar(grupo.id, actor));
  }

  @ApiOperation({ summary: i18n.swagger.grupos.listar_summary })
  @Get()
  @Roles(Rol.ADMIN)
  async listar() {
    return (await this.listarGrupos.ejecutar()).map(presentarGrupo);
  }

  @ApiOperation({ summary: i18n.swagger.grupos.mios_summary })
  @Get('mios')
  async mios(@ActorActual() actor: Actor) {
    return (await this.obtenerMisGrupos.ejecutar(actor)).map(presentarGrupo);
  }

  @ApiOperation({ summary: i18n.swagger.grupos.obtener_summary })
  @Get(':id')
  async obtener(
    @Param('id', ParseObjectIdPipe) id: string,
    @ActorActual() actor: Actor,
  ) {
    return presentarGrupo(await this.obtenerGrupo.ejecutar(id, actor));
  }

  @ApiOperation({ summary: i18n.swagger.grupos.actualizar_summary })
  @Patch(':id')
  @Roles(Rol.ADMIN)
  async actualizar(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: ActualizarGrupoDto,
    @ActorActual() actor: Actor,
  ) {
    await this.actualizarGrupo.ejecutar(id, conFecha(dto));
    return presentarGrupo(await this.obtenerGrupo.ejecutar(id, actor));
  }

  @ApiOperation({ summary: i18n.swagger.grupos.eliminar_summary })
  @Delete(':id')
  @Roles(Rol.ADMIN)
  @HttpCode(204)
  eliminar(@Param('id', ParseObjectIdPipe) id: string) {
    return this.eliminarGrupo.ejecutar(id);
  }

  @ApiOperation({ summary: i18n.swagger.grupos.alumnos_summary })
  @Get(':id/alumnos')
  @Roles(Rol.ADMIN, Rol.MAESTRO)
  async alumnos(
    @Param('id', ParseObjectIdPipe) id: string,
    @ActorActual() actor: Actor,
  ) {
    return (await this.listarAlumnos.ejecutar(id, actor)).map(presentarUsuario);
  }

  @ApiOperation({ summary: i18n.swagger.grupos.inscribir_summary })
  @Post(':id/alumnos')
  @Roles(Rol.ADMIN)
  async inscribir(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: InscribirAlumnosDto,
  ) {
    return (await this.inscribirAlumnos.ejecutar(id, dto.alumnoIds)).map(
      presentarUsuario,
    );
  }

  @ApiOperation({ summary: i18n.swagger.grupos.baja_summary })
  @Delete(':id/alumnos/:alumnoId')
  @Roles(Rol.ADMIN)
  @HttpCode(204)
  darDeBaja(
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('alumnoId', ParseObjectIdPipe) alumnoId: string,
  ) {
    return this.darDeBajaAlumno.ejecutar(id, alumnoId);
  }
}
