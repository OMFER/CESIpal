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
  ActualizarMateria,
  CrearMateria,
  EliminarMateria,
  ListarMaterias,
  ObtenerMateria,
} from '../application/gestionar-materias';
import { ActualizarMateriaDto, CrearMateriaDto } from './materia.dto';
import { presentarMateria } from './materia.presenter';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
    private readonly listarMaterias: ListarMaterias,
    private readonly obtenerMateria: ObtenerMateria,
  ) {}

  @ApiOperation({ summary: i18n.swagger.materias.crear_summary })
  @Post()
  @Roles(Rol.ADMIN)
  async crear(@Body() dto: CrearMateriaDto) {
    return presentarMateria(await this.crearMateria.ejecutar(dto));
  }

  @ApiOperation({ summary: i18n.swagger.materias.listar_summary })
  @Get()
  @Roles(Rol.ADMIN)
  async listar() {
    return (await this.listarMaterias.ejecutar()).map(presentarMateria);
  }

  @ApiOperation({ summary: i18n.swagger.materias.obtener_summary })
  @Get(':id')
  async obtener(
    @Param('id', ParseObjectIdPipe) id: string,
    @ActorActual() actor: Actor,
  ) {
    return presentarMateria(await this.obtenerMateria.ejecutar(id, actor));
  }

  @ApiOperation({ summary: i18n.swagger.materias.actualizar_summary })
  @Patch(':id')
  @Roles(Rol.ADMIN)
  async actualizar(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: ActualizarMateriaDto,
  ) {
    return presentarMateria(await this.actualizarMateria.ejecutar(id, dto));
  }

  @ApiOperation({ summary: i18n.swagger.materias.eliminar_summary })
  @Delete(':id')
  @Roles(Rol.ADMIN)
  @HttpCode(204)
  eliminar(@Param('id', ParseObjectIdPipe) id: string) {
    return this.eliminarMateria.ejecutar(id);
  }
}
