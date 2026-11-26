import { OmitType, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoRecurso } from '../domain/clase';
import { SEMANAS_POR_MATERIA } from '../../planes/domain/plan';

export class LinksDto {
  @IsOptional()
  @IsUrl({}, { message: 'El enlace de la grabación debe ser una URL válida' })
  grabacion?: string;

  @IsOptional()
  @IsString()
  descGrabacion?: string;

  @IsOptional()
  @IsUrl(
    {},
    { message: 'El enlace de la presentación debe ser una URL válida' },
  )
  presentacion?: string;
}

export class RecursoDto {
  @IsEnum(TipoRecurso, {
    message: 'El tipo de recurso debe ser pdf, web o youtube',
  })
  tipo!: TipoRecurso;

  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @IsUrl({}, { message: 'El recurso debe tener una URL válida' })
  url!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}

export class CrearClaseDto {
  @IsMongoId()
  @IsNotEmpty()
  materiaId!: string;

  // Semana de la materia (1 o 2)
  @IsInt()
  @Min(1)
  @Max(SEMANAS_POR_MATERIA)
  semana!: number;

  @IsString()
  @IsNotEmpty()
  tema!: string;

  @IsOptional()
  @IsString()
  introduccion?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecursoDto)
  recursos?: RecursoDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => LinksDto)
  links?: LinksDto;
}

// La materia y la semana no se cambian: identifican al contenido
export class ActualizarClaseDto extends PartialType(
  OmitType(CrearClaseDto, ['materiaId', 'semana'] as const),
) {}
