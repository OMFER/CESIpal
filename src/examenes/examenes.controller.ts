import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ExamenesService } from './examenes.service';
import { CreateExamenDto } from './dto/create-examene.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../usuarios/schemas/usuario.schema';

@Controller('examenes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamenesController {
  constructor(private readonly examenesService: ExamenesService) { }

  @Post()
  @Roles(Rol.MAESTRO)
  create(@Body() createExamenDto: CreateExamenDto) {
    return this.examenesService.create(createExamenDto);
  }

  @Get('materia/:materiaId')
  findByMateria(@Param('materiaId') materiaId: string) {
    return this.examenesService.findByMateria(materiaId);
  }
}