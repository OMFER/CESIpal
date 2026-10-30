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

  @Post()
  @Roles(Rol.ADMIN)
  async crear(@Body() dto: CrearMateriaDto) {
    return presentarMateria(await this.crearMateria.ejecutar(dto));
  }

  @Get()
  @Roles(Rol.ADMIN)
  async listar() {
    return (await this.listarMaterias.ejecutar()).map(presentarMateria);
  }

  @Get(':id')
  async obtener(
    @Param('id', ParseObjectIdPipe) id: string,
    @ActorActual() actor: Actor,
  ) {
    return presentarMateria(await this.obtenerMateria.ejecutar(id, actor));
  }

  @Patch(':id')
  @Roles(Rol.ADMIN)
  async actualizar(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: ActualizarMateriaDto,
  ) {
    return presentarMateria(await this.actualizarMateria.ejecutar(id, dto));
  }

  @Delete(':id')
  @Roles(Rol.ADMIN)
  @HttpCode(204)
  eliminar(@Param('id', ParseObjectIdPipe) id: string) {
    return this.eliminarMateria.ejecutar(id);
  }
}
