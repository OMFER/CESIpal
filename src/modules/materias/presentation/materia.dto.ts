import { OmitType, PartialType } from '@nestjs/mapped-types';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { MAXIMO_SEMANAS } from '../domain/materia';

export class CrearMateriaDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAXIMO_SEMANAS)
  totalSemanas?: number;
}

export class ActualizarMateriaDto extends PartialType(CrearMateriaDto) {}

export class CrearGrupoDto {
  @IsMongoId({ message: 'materiaId debe ser un id válido' })
  materiaId!: string;

  @IsMongoId({ message: 'maestroId debe ser un id válido' })
  maestroId!: string;

  @IsString()
  @IsNotEmpty()
  nombre!: string;

  // Etiqueta del semestre, p. ej. "2026-B"
  @IsString()
  @IsNotEmpty()
  periodo!: string;

  @IsOptional()
  @IsString()
  aula?: string;

  @IsDateString({}, { message: 'fechaInicio debe ser una fecha (YYYY-MM-DD)' })
  fechaInicio!: string;
}

// La materia de un grupo no cambia
export class ActualizarGrupoDto extends PartialType(
  OmitType(CrearGrupoDto, ['materiaId'] as const),
) {}

export class InscribirAlumnosDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  alumnoIds!: string[];
}
