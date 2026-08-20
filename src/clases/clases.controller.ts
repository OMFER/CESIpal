import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ClasesService } from './clases.service';
import { CreateClaseDto } from './dto/create-clase.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../usuarios/schemas/usuario.schema';

@Controller('clases')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClasesController {
  constructor(private readonly clasesService: ClasesService) { }

  @Post()
  @Roles(Rol.MAESTRO)
  create(@Body() createClaseDto: CreateClaseDto) {
    return this.clasesService.create(createClaseDto);
  }

  @Get('materia/:materiaId')
  findByMateria(@Param('materiaId') materiaId: string) {
    return this.clasesService.findByMateria(materiaId);
  }
}