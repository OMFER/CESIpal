import { PartialType } from '@nestjs/mapped-types';
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
  @IsString()
  grupo?: string;

  @IsOptional()
  @IsString()
  aula?: string;

  @IsMongoId({ message: 'maestroId debe ser un id válido' })
  maestroId!: string;

  @IsDateString({}, { message: 'fechaInicio debe ser una fecha (YYYY-MM-DD)' })
  fechaInicio!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAXIMO_SEMANAS)
  totalSemanas?: number;
}

export class ActualizarMateriaDto extends PartialType(CrearMateriaDto) {}

export class InscribirAlumnosDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  alumnoIds!: string[];
}
