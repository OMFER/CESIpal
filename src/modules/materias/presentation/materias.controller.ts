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
  ActualizarMateria,
  CrearMateria,
  EliminarMateria,
  ListarMaterias,
} from '../application/gestionar-materias';
import {
  ObtenerMateria,
  ObtenerMisMaterias,
} from '../application/consultar-calendario';
import {
  DarDeBajaAlumno,
  InscribirAlumnos,
  ListarAlumnosDeMateria,
} from '../application/gestionar-inscripciones';
import {
  ActualizarMateriaDto,
  CrearMateriaDto,
  InscribirAlumnosDto,
} from './materia.dto';
import {
  presentarMateria,
  presentarMateriaConCalendario,
} from './materia.presenter';

@Controller('materias')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MateriasController {
  constructor(
    private readonly crearMateria: CrearMateria,
    private readonly actualizarMateria: ActualizarMateria,
    private readonly eliminarMateria: EliminarMateria,
    private readonly listarMaterias: ListarMaterias,
    private readonly obtenerMisMaterias: ObtenerMisMaterias,
    private readonly obtenerMateria: ObtenerMateria,
    private readonly inscribirAlumnos: InscribirAlumnos,
    private readonly darDeBajaAlumno: DarDeBajaAlumno,
    private readonly listarAlumnos: ListarAlumnosDeMateria,
  ) {}

  @Post()
  @Roles(Rol.ADMIN)
  async crear(@Body() dto: CrearMateriaDto) {
    const materia = await this.crearMateria.ejecutar({
      ...dto,
      fechaInicio: new Date(dto.fechaInicio),
    });
    return presentarMateria({ materia, maestro: null });
  }

  @Get()
  @Roles(Rol.ADMIN)
  async listar() {
    return (await this.listarMaterias.ejecutar()).map(presentarMateria);
  }

  @Get('mias')
  async mias(@ActorActual() actor: Actor) {
    return (await this.obtenerMisMaterias.ejecutar(actor)).map(
      presentarMateriaConCalendario,
    );
  }

  @Get(':id')
  async obtener(
    @Param('id', ParseObjectIdPipe) id: string,
    @ActorActual() actor: Actor,
  ) {
    return presentarMateriaConCalendario(
      await this.obtenerMateria.ejecutar(id, actor),
    );
  }

  @Patch(':id')
  @Roles(Rol.ADMIN)
  async actualizar(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: ActualizarMateriaDto,
  ) {
    const { fechaInicio, ...resto } = dto;
    const cambios =
      fechaInicio === undefined
        ? resto
        : { ...resto, fechaInicio: new Date(fechaInicio) };
    const materia = await this.actualizarMateria.ejecutar(id, cambios);
    return presentarMateria({ materia, maestro: null });
  }

  @Delete(':id')
  @Roles(Rol.ADMIN)
  @HttpCode(204)
  eliminar(@Param('id', ParseObjectIdPipe) id: string) {
    return this.eliminarMateria.ejecutar(id);
  }

  @Get(':id/alumnos')
  @Roles(Rol.ADMIN, Rol.MAESTRO)
  async alumnos(
    @Param('id', ParseObjectIdPipe) id: string,
    @ActorActual() actor: Actor,
  ) {
    return (await this.listarAlumnos.ejecutar(id, actor)).map(presentarUsuario);
  }

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
