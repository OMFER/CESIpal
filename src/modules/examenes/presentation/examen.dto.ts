import { OmitType, PartialType } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  MAXIMO_DIAS_EXTRA,
  MAXIMO_OPCIONES,
  MINIMO_OPCIONES,
  TipoExamen,
} from '../domain/examen';

export class PreguntaDto {
  @IsString()
  @IsNotEmpty()
  enunciado!: string;

  @IsArray()
  @ArrayMinSize(MINIMO_OPCIONES, {
    message: `Cada pregunta necesita al menos ${MINIMO_OPCIONES} opciones`,
  })
  @ArrayMaxSize(MAXIMO_OPCIONES, {
    message: `Cada pregunta admite máximo ${MAXIMO_OPCIONES} opciones`,
  })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  opciones!: string[];

  @IsInt()
  @Min(0)
  respuestaCorrecta!: number;
}

export class CrearExamenDto {
  @IsMongoId()
  @IsNotEmpty()
  materiaId!: string;

  @IsEnum(TipoExamen, {
    message: 'El tipo debe ser Semanal, Reposicion o Final',
  })
  tipo!: TipoExamen;

  // Obligatoria en Semanal y Reposicion; no se envía en el Final
  @IsOptional()
  @IsInt()
  @Min(1)
  semana?: number;

  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  puntajeMaximo?: number;

  // Días de prórroga sobre la ventana normal del examen
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAXIMO_DIAS_EXTRA)
  diasExtra?: number;

  @IsArray()
  @ArrayMinSize(1, { message: 'El examen necesita al menos una pregunta' })
  @ValidateNested({ each: true })
  @Type(() => PreguntaDto)
  preguntas!: PreguntaDto[];
}

// El tipo y la semana identifican al examen: no se cambian
export class ActualizarExamenDto extends PartialType(
  OmitType(CrearExamenDto, ['materiaId', 'tipo', 'semana'] as const),
) {}

export class ResponderExamenDto {
  // Índice de la opción elegida por pregunta, en el orden en que se recibieron
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  respuestas!: number[];
}
